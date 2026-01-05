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
  pdfEngine: PdfEngine;
}

export interface PreprocessResult {
  inputPath: string;
  tempDir: string;
  headerTexPath?: string;
}

/**
 * Very small preprocessor: writes the note content to a temporary input file.
 * In the future this will handle fenced directive blocks like ```latex-header```.
 */
export async function preprocessNoteToTempFile(
  app: App,
  file: TFile,
): Promise<PreprocessResult> {
  const content = await app.vault.read(file);

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "obsidian-latex-pdf-"));
  const inputPath = path.join(tempDir, "input.md");

  await fs.writeFile(inputPath, content, "utf8");

  return { inputPath, tempDir };
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
  const { pandocPath, pdfEngine } = settings;

  const { inputPath, tempDir, headerTexPath } = await preprocessNoteToTempFile(app, file);

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
    pdfEngine,
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

  if (headerTexPath) {
    args.push("--include-in-header", headerTexPath);
  }

  args.push("-o", outputPath);

  await execFileAsync(pandocPath, args, { cwd: tempDir });

  return outputPath;
}
