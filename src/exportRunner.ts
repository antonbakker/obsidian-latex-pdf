import { App, Notice, TFile } from "obsidian";
import { promisify } from "util";
import { execFile } from "child_process";
import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import type { TemplateDefinition } from "./templateRegistry";

const execFileAsync = promisify(execFile);

export interface ExportSettings {
  pandocPath: string;
  pdfEngine: "xelatex" | "lualatex" | "pdflatex";
}

/**
 * Runs pandoc to export the given note to a PDF using the selected template.
 *
 * For now this writes the input and output to a temporary directory and shows
 * the resulting PDF path in a notice.
 */
export async function exportNoteToPdf(
  app: App,
  file: TFile,
  template: TemplateDefinition,
  settings: ExportSettings,
): Promise<void> {
  const { pandocPath, pdfEngine } = settings;

  const content = await app.vault.read(file);

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "obsidian-latex-pdf-"));
  const inputPath = path.join(tempDir, "input.md");
  const outputPath = path.join(tempDir, "output.pdf");

  await fs.writeFile(inputPath, content, "utf8");

  const args: string[] = [
    inputPath,
    "--from=markdown+tex_math_dollars+raw_tex+link_attributes",
    "--pdf-engine",
    pdfEngine,
  ];

  if (template.pandocTemplateRelativePath) {
    const templatePath = path.join(__dirname, template.pandocTemplateRelativePath);
    args.push("--template", templatePath);
  }

  args.push("-o", outputPath);

  try {
    await execFileAsync(pandocPath, args, { cwd: tempDir });
  } catch (error: any) {
    console.error("Pandoc export failed", error);
    new Notice("LaTeX PDF export failed. Check console for details.");
    return;
  }

  new Notice(`LaTeX PDF exported to temporary file: ${outputPath}`);
}
