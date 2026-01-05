import { App, Notice, TFile } from "obsidian";
import type { TemplateDefinition } from "./templateRegistry";
import { runPandocToPdf, PandocRunnerSettings } from "./pandocRunner";

export interface ExportSettings extends PandocRunnerSettings {}

/**
 * Runs pandoc to export the given note to a PDF using the selected template.
 *
 * The resulting PDF is written next to the note in the vault (same folder,
 * same basename with `.pdf` extension), and a notice shows the output path.
 */
export async function exportNoteToPdf(
  app: App,
  file: TFile,
  template: TemplateDefinition,
  settings: ExportSettings,
): Promise<void> {
  try {
    const outputPath = await runPandocToPdf({
      app,
      file,
      template,
      settings,
    });
    new Notice(`LaTeX PDF exported: ${outputPath}`);
  } catch (error: any) {
    console.error("Pandoc export failed", error);
    new Notice("LaTeX PDF export failed. Check console for details.");
  }
}
