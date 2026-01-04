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

export interface ExportTargetOptions {
  /** Vault-relative path for the output PDF (e.g. "Exports/my-note.pdf"). */
  vaultPath?: string;
}

/**
 * Runs pandoc to export the given note to a PDF using the selected template.
 *
 * By default this writes the input and output to a temporary directory and
 * shows the resulting PDF path in a notice. When a vaultPath is provided, the
 * resulting PDF is copied into the vault at that location instead.
 */
export async function exportNoteToPdf(
  app: App,
  file: TFile,
  template: TemplateDefinition,
  settings: ExportSettings,
  target?: ExportTargetOptions,
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
    // TODO: wire real pandoc template file per TemplateDefinition.
    "-o",
    outputPath,
  ];

  try {
    await execFileAsync(pandocPath, args, { cwd: tempDir });
  } catch (error: any) {
    console.error("Pandoc export failed", error);
    new Notice("LaTeX PDF export failed. Check console for details.");
    return;
  }

  if (target?.vaultPath) {
    try {
      const pdfBytes = await fs.readFile(outputPath);
      const vaultPath = target.vaultPath;
      const vault = app.vault;

      const lastSlash = vaultPath.lastIndexOf("/");
      const folderPath = lastSlash > 0 ? vaultPath.substring(0, lastSlash) : "";

      if (folderPath && !vault.getAbstractFileByPath(folderPath)) {
        await vault.createFolder(folderPath);
      }

      const existing = vault.getAbstractFileByPath(vaultPath);
      if (existing instanceof TFile) {
        await vault.modifyBinary(existing, pdfBytes);
      } else {
        await vault.createBinary(vaultPath, pdfBytes);
      }

      new Notice(`LaTeX PDF exported to: ${vaultPath}`);
    } catch (error: any) {
      console.error("Failed to copy LaTeX PDF into vault", error);
      new Notice("LaTeX PDF was generated, but copying into the vault failed.");
    }
  } else {
    new Notice(`LaTeX PDF exported to temporary file: ${outputPath}`);
  }
}
