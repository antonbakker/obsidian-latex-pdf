import { App, Modal, Setting, TFile } from "obsidian";
import type { TemplateDefinition } from "../templateRegistry";

export interface PrintModalOptions {
  file: TFile;
  template: TemplateDefinition;
}

/**
 * PrintModal is the main UI entry for exporting a note via a LaTeX template.
 * For now it shows basic information and acts as the starting point where
 * validation and pandoc/LaTeX export will be wired in.
 */
export class PrintModal extends Modal {
  private readonly file: TFile;
  private readonly template: TemplateDefinition;

  constructor(app: App, options: PrintModalOptions) {
    super(app);
    this.file = options.file;
    this.template = options.template;
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
        "Validation and pandoc/LaTeX export are not yet implemented. This modal is the anchor point where those steps will be executed.",
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
          .setTooltip("Export (coming soon)")
          .onClick(() => {
            // Placeholder action until export is wired in.
            this.close();
          });
      });
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
