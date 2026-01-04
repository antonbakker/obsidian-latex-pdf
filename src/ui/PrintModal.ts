import { App, Modal, Setting, TFile } from "obsidian";
import type { TemplateDefinition } from "../templateRegistry";

export interface PrintModalOptions {
  file: TFile;
  template: TemplateDefinition;
  initialOutputFolder: string;
  initialOutputFilename: string;
  /**
   * Called when the user clicks Export. The callback receives the desired
   * vault-relative folder and filename (without extension) for the output.
   */
  onExport: (options: { outputFolder: string; outputFilename: string }) => void;
}

/**
 * PrintModal is the main UI entry for exporting a note via a LaTeX template.
 * It currently displays basic information and provides an Export button that
 * triggers the pandoc/LaTeX export pipeline provided by the caller.
 */
export class PrintModal extends Modal {
  private readonly file: TFile;
  private readonly template: TemplateDefinition;
  private readonly onExport: (options: { outputFolder: string; outputFilename: string }) => void;
  private outputFolder: string;
  private outputFilename: string;

  constructor(app: App, options: PrintModalOptions) {
    super(app);
    this.file = options.file;
    this.template = options.template;
    this.onExport = options.onExport;
    this.outputFolder = options.initialOutputFolder;
    this.outputFilename = options.initialOutputFilename;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl("h2", { text: "LaTeX PDF export" });

    contentEl.createEl("p", {
      text: `Note: ${this.file.name}`,
    });

    contentEl.createEl("p", {
      text: `Template: ${this.template.label} (${this.template.id})`,
    });

    contentEl.createEl("p", {
      text:
        "Choose where to store the generated PDF (inside your vault), then click Export.",
    });

    new Setting(contentEl)
      .setName("Output folder (in vault)")
      .setDesc("Vault-relative folder path, e.g. 'Exports' or 'notes/exports'.")
      .addText((text) => {
        text
          .setPlaceholder("Exports")
          .setValue(this.outputFolder)
          .onChange((value) => {
            this.outputFolder = value;
          });
      });

    new Setting(contentEl)
      .setName("Output filename")
      .setDesc("Filename without extension. '.pdf' will be added automatically.")
      .addText((text) => {
        text
          .setPlaceholder(this.file.basename)
          .setValue(this.outputFilename)
          .onChange((value) => {
            this.outputFilename = value;
          });
      });

    const buttonBar = contentEl.createDiv({ cls: "latex-pdf-modal-buttons" });

    new Setting(buttonBar)
      .addButton((btn) => {
        btn.setButtonText("Close").onClick(() => {
          this.close();
        });
      })
      .addExtraButton((btn) => {
        btn
          .setIcon("printer")
          .setTooltip("Export to LaTeX PDF")
          .onClick(() => {
            this.onExport({
              outputFolder: this.outputFolder,
              outputFilename: this.outputFilename,
            });
          });
      });
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
