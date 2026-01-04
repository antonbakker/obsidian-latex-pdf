import { App, Modal, Setting } from "obsidian";
import type { TemplateDefinition } from "../templateRegistry";

export interface TemplatePickerOptions {
  templates: TemplateDefinition[];
  initialTemplateId?: string;
  onSelect: (template: TemplateDefinition) => void;
}

export class TemplatePickerModal extends Modal {
  private readonly templates: TemplateDefinition[];
  private readonly onSelect: (template: TemplateDefinition) => void;
  private selectedId: string;

  constructor(app: App, options: TemplatePickerOptions) {
    super(app);
    this.templates = options.templates;
    this.onSelect = options.onSelect;
    this.selectedId =
      options.initialTemplateId &&
      this.templates.some((t) => t.id === options.initialTemplateId)
        ? options.initialTemplateId
        : this.templates[0]?.id;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl("h2", { text: "Export to LaTeX PDF" });
    contentEl.createEl("p", {
      text: "Choose a LaTeX/Pandoc template to use for exporting this note.",
    });

    new Setting(contentEl)
      .setName("Template")
      .setDesc("Select the LaTeX template for this export.")
      .addDropdown((dropdown) => {
        for (const tpl of this.templates) {
          dropdown.addOption(tpl.id, tpl.label);
        }
        if (this.selectedId) {
          dropdown.setValue(this.selectedId);
        }
        dropdown.onChange((value) => {
          this.selectedId = value;
        });
      });

    const buttonBar = contentEl.createDiv({ cls: "latex-pdf-modal-buttons" });

    new Setting(buttonBar)
      .addButton((btn) => {
        btn.setButtonText("Cancel").onClick(() => {
          this.close();
        });
      })
      .addButton((btn) => {
        btn.setCta().setButtonText("Continue").onClick(() => {
          const selected = this.templates.find((t) => t.id === this.selectedId);
          if (selected) {
            this.onSelect(selected);
          }
          this.close();
        });
      });
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
