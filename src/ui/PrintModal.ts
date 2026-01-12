import { App, Modal, Setting, TFile } from "obsidian";
import type { TemplateDefinition } from "../templateRegistry";
import type { ValidationResult } from "../validation/validator";

export interface PrintModalOptions {
  file: TFile;
  template: TemplateDefinition;
  validation?: ValidationResult;
  onExport: () => void;
}

export class PrintModal extends Modal {
  private readonly file: TFile;
  private readonly template: TemplateDefinition;
  private readonly validation?: ValidationResult;
  private readonly onExport: () => void;

  constructor(app: App, options: PrintModalOptions) {
    super(app);
    this.file = options.file;
    this.template = options.template;
    this.validation = options.validation;
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

    // Validation summary (if available)
    if (this.validation) {
      const box = contentEl.createDiv({ cls: "latex-pdf-validation" });
      const { issues, isValid } = this.validation;

      box.createEl("h3", { text: "Template validation" });

      if (!issues.length) {
        box.createEl("p", { text: "No validation issues detected for this template." });
      } else {
        const errorCount = issues.filter((i) => i.level === "error").length;
        const warningCount = issues.filter((i) => i.level === "warning").length;

        const summary = isValid
          ? `Validation completed with ${warningCount} warning(s).`
          : `Validation found ${errorCount} error(s) and ${warningCount} warning(s). Fix errors before exporting if possible.`;

        box.createEl("p", { text: summary });

        const list = box.createEl("ul");
        for (const issue of issues) {
          const li = list.createEl("li");
          li.textContent = `${issue.level.toUpperCase()}: ${issue.message}`;
        }
      }
    }

    const buttonBar = contentEl.createDiv({ cls: "latex-pdf-modal-buttons" });

    const hasValidation = !!this.validation;
    const isValid = this.validation ? this.validation.isValid : true;

    new Setting(buttonBar)
      .addButton((btn) => {
        btn.setButtonText("Close").onClick(() => {
          this.close();
        });
      })
      .addExtraButton((btn) => {
        btn
          .setIcon("printer")
          .setTooltip(
            isValid
              ? "Export to LaTeX PDF"
              : "Fix validation errors before exporting to LaTeX PDF",
          );

        if (hasValidation && !isValid) {
          // When validation is present and has blocking errors, disable export
          // to reduce the likelihood of failed LaTeX/PDF generation.
          btn.setDisabled(true);
        }

        btn.onClick(() => {
          if (!isValid) {
            return;
          }
          this.onExport();
        });
      });
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
