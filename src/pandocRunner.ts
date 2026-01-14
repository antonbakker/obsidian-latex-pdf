import { App, TFile } from "obsidian";
import { promisify } from "util";
import { execFile } from "child_process";
import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import type { TemplateDefinition } from "./templateRegistry";

const execFileAsync = promisify(execFile);

export type PdfEngine = "xelatex" | "lualatex" | "pdflatex";

export interface PandocRunnerSettings {
  pandocPath: string;
  /**
   * Logical PDF engine selection (e.g. "xelatex", "lualatex", "pdflatex").
   * This is primarily used for the settings UI.
   */
  pdfEngine: PdfEngine;
  /**
   * Optional override for the actual binary/command passed to pandoc via
   * --pdf-engine. When set, this value is used verbatim and can be a full
   * filesystem path (e.g. "/Library/TeX/texbin/xelatex"). When empty, the
   * logical pdfEngine above is used instead.
   */
  pdfEngineBinary?: string;
}

export interface PreprocessResult {
  inputPath: string;
  tempDir: string;
  headerTexPath?: string;
}

function isAbsolutePath(p: string): boolean {
  return path.isAbsolute(p) || /^[A-Za-z]:[\\/]/.test(p);
}

/**
 * Inject a level-1 heading using the note title when the first heading in the
 * body is not already level 1 (#).
 *
 * Rules:
 * - Respect YAML frontmatter at the top of the file (insert after frontmatter).
 * - If the first heading (after frontmatter) is H1, do nothing.
 * - If the first heading is H2–H6 or there are no headings, insert "# <title>"
 *   as the first body line (after frontmatter) followed by a blank line.
 */
export function injectNoteTitleHeadingIfMissing(
  content: string,
  noteTitle: string,
): string {
  let lines = content.split(/\r?\n/);
  if (lines.length === 0) {
    return `# ${noteTitle}`;
  }

  // First pass: if there is YAML frontmatter but no title field, inject
  // title: "<noteTitle>" into the frontmatter so pandoc/LaTeX see a title
  // consistent with the note name.
  if (lines[0].trim() === "---") {
    let fmEnd = -1;
    let hasTitle = false;
    for (let i = 1; i < lines.length; i += 1) {
      const line = lines[i];
      if (/^title\s*:/.test(line)) {
        hasTitle = true;
      }
      if (line.trim() === "---") {
        fmEnd = i;
        break;
      }
    }

    if (fmEnd !== -1 && !hasTitle) {
      const beforeFm = lines.slice(0, fmEnd + 1); // includes closing ---
      const afterFm = lines.slice(fmEnd + 1);
      const safeTitle = noteTitle.replace(/"/g, '\\"');
      const titleLine = `title: "${safeTitle}"`;
      // Insert title after opening ---
      const newFrontmatter = [beforeFm[0], titleLine, ...beforeFm.slice(1)];
      lines = [...newFrontmatter, ...afterFm];
    }
  }

  // Second pass: detect frontmatter boundaries and determine where the body
  // starts so we can decide where to insert the H1 heading.
  let index = 0;
  let inFrontmatter = false;

  if (lines[0].trim() === "---") {
    inFrontmatter = true;
    index = 1;
    while (index < lines.length) {
      if (lines[index].trim() === "---") {
        index += 1; // move past closing ---
        break;
      }
      index += 1;
    }
  }

  // Find the first markdown heading after frontmatter.
  let firstHeadingLevel: number | null = null;
  for (let i = index; i < lines.length; i += 1) {
    const line = lines[i];
    const match = /^(#{1,6})\s+/.exec(line);
    if (match) {
      firstHeadingLevel = match[1].length;
      break;
    }
  }

  if (firstHeadingLevel === 1) {
    // Already has a level-1 heading; no change needed.
    return content;
  }

  const headingLine = `# ${noteTitle}`;

  if (inFrontmatter) {
    const before = lines.slice(0, index);
    const after = lines.slice(index);

    // Avoid inserting an extra blank line if the first body line is already
    // empty. This keeps spacing consistent when there is an empty line
    // between frontmatter and the first heading.
    if (after.length > 0 && after[0].trim() === "") {
      const newBody = [headingLine, ...after];
      return [...before, ...newBody].join("\n");
    }

    const newBody = [headingLine, "", ...after];
    return [...before, ...newBody].join("\n");
  }

  // No frontmatter: prepend heading at the top.
  return [headingLine, "", ...lines].join("\n");
}

/**
 * Transform Obsidian-style callouts of the form:
 *
 * > [!info] Optional title
 * > body line 1
 * > body line 2
 *
 * into LaTeX environments like:
 *
 * \begin{callout-info}{Optional title}
 * body line 1
 * body line 2
 * \end{callout-info}
 */
function transformCallouts(content: string): string {
  const lines = content.split(/\r?\n/);
  const out: string[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const calloutMatch = /^>\s*\[!([A-Za-z0-9_-]+)\]\s*(.*)$/.exec(line);
    if (!calloutMatch) {
      out.push(line);
      i += 1;
      continue;
    }

    const rawType = calloutMatch[1].toLowerCase();
    const titleText = calloutMatch[2].trim();

    let env = "callout-note";

    switch (rawType) {
      case "info":
      case "note":
        env = "callout-info";
        break;
      case "warning":
      case "caution":
        env = "callout-warning";
        break;
      case "tip":
      case "success":
        env = "callout-tip";
        break;
      default:
        env = "callout-note";
        break;
    }

    // When the markdown callout has a heading (e.g. > [!info] Title), use it
    // as the optional LaTeX environment argument so the callout layout can
    // distinguish between titled and untitled variants. When no heading is
    // provided, omit the title rather than synthesising a default label.
    if (titleText.length > 0) {
      out.push(`\\begin{${env}}[${titleText}]`);
    } else {
      out.push(`\\begin{${env}}`);
    }

    i += 1;
    while (i < lines.length) {
      const bodyLine = lines[i];
      if (!bodyLine.startsWith(">")) break;
      out.push(bodyLine.replace(/^>\s?/, ""));
      i += 1;
    }

    out.push(`\\end{${env}}`);
  }

  return out.join("\n");
}

/**
 * Preprocessor: reads the note content, injects a top-level heading derived
 * from the note title when appropriate, and writes the result to a temporary
 * input file for pandoc. It also resolves an optional LaTeX profile preamble
 * based on the `latex_pdf_profile` frontmatter field and the plugin settings.
 */
export async function preprocessNoteToTempFile(
  app: App,
  file: TFile,
  settings: PandocRunnerSettings & { enableLatexProfiles?: boolean; latexProfileBaseDir?: string },
): Promise<PreprocessResult> {
  const rawContent = await app.vault.read(file);
  const withHeading = injectNoteTitleHeadingIfMissing(rawContent, file.basename);
  const contentWithHeading = transformCallouts(withHeading);

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "obsidian-latex-pdf-"));
  const inputPath = path.join(tempDir, "input.md");

  await fs.writeFile(inputPath, contentWithHeading, "utf8");

  let headerTexPath: string | undefined;

  if (settings.enableLatexProfiles && settings.latexProfileBaseDir) {
    const cache = app.metadataCache.getFileCache(file);
    const fm = cache?.frontmatter as Record<string, unknown> | undefined;
    const rawProfile = fm?.["latex_pdf_profile"];
    if (typeof rawProfile === "string" && rawProfile.trim().length > 0) {
      const profileId = rawProfile.trim();
      const baseDir = settings.latexProfileBaseDir;

      const vaultBasePath = (app.vault as any).adapter?.basePath as string | undefined;
      let baseAbs: string | undefined;
      if (isAbsolutePath(baseDir)) {
        baseAbs = baseDir;
      } else if (vaultBasePath) {
        baseAbs = path.join(vaultBasePath, baseDir);
      }

      if (baseAbs) {
        const candidate = path.join(baseAbs, profileId, "preamble.tex");
        try {
          await fs.access(candidate);
          headerTexPath = candidate;
        } catch {
          // Missing profile preamble: silently ignore for now.
        }
      }
    }
  }

  return { inputPath, tempDir, headerTexPath };
}

export async function runPandocToPdf(
  opts: {
    app: App;
    file: TFile;
    template: TemplateDefinition;
    settings: PandocRunnerSettings;
  },
): Promise<string> {
  const { app, file, template, settings } = opts;
  const { pandocPath, pdfEngine, pdfEngineBinary } = settings;

  const engineCommand = pdfEngineBinary && pdfEngineBinary.trim().length > 0
    ? pdfEngineBinary
    : pdfEngine;

  const { inputPath, tempDir, headerTexPath } = await preprocessNoteToTempFile(app, file, settings as any);

  const notePath = file.path; // e.g. "folder/note.md"
  const noteDir = notePath.includes("/") ? notePath.substring(0, notePath.lastIndexOf("/")) : "";
  const noteBase = file.basename;

  // Resolve vault-relative directory to an absolute path on disk
  const vaultBasePath = (app.vault as any).adapter?.basePath as string | undefined;
  const outputDir = vaultBasePath && noteDir ? path.join(vaultBasePath, noteDir) : vaultBasePath || tempDir;
  const outputPath = path.join(outputDir, `${noteBase}.pdf`);

  const args: string[] = [
    inputPath,
    "--from=markdown+tex_math_dollars+raw_tex+link_attributes",
    "--pdf-engine",
    engineCommand,
    // Enable Pandoc's default syntax highlighting so code blocks are highlighted in the output.
  ];

  if (template.pandocTemplateRelativePath) {
    // NOTE: In the compiled plugin inside Obsidian, __dirname can resolve to the
    // app bundle renderer directory (e.g. electron.asar/renderer), which breaks
    // relative template resolution. For this project we resolve templates
    // against the plugin source directory path on disk.
    const pluginTemplateBase = "/Users/anton/Development/989646093931/obsidian-latex-pdf";
    const templatePath = path.join(pluginTemplateBase, template.pandocTemplateRelativePath);
    args.push("--template", templatePath);
  }

  // Always include the common callouts preamble so that transformed
  // callout environments compile correctly.
  const calloutsPreamble = "/Users/anton/Development/989646093931/obsidian-latex-pdf/templates/common/callouts.tex";
  args.push("--include-in-header", calloutsPreamble);

  if (headerTexPath) {
    args.push("--include-in-header", headerTexPath);
  }

  args.push("-o", outputPath);

  await execFileAsync(pandocPath, args, { cwd: tempDir });

  return outputPath;
}
