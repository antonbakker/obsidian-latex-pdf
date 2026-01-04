import { App, Modal, Setting, TFile } from "obsidian";
import type { TemplateDefinition } from "../templateRegistry";

export interface PrintModalOptions {
  file: TFile;
  template: TemplateDefinition;
  onExport: () => void;
}

/**
 * PrintModal is the main UI entry for exporting a note via a LaTeX template.
 * It currently displays basic information and provides an Export button that
 * triggers the pandoc/LaTeX export pipeline provided by the caller.
 */
export class PrintModal extends Modal {
  private readonly file: TFile;
  private readonly template: TemplateDefinition;
  private readonly onExport: () => void;

  constructor(app: App, options: PrintModalOptions) {
    super(app);
    this.file = options.file;
    this.template = options.template;
    this.onExport = options.onExport;
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
        "Review the note and template, then click Export to generate a PDF using your local pandoc and LaTeX installation.",
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
            this.onExport();
          });
      });
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
