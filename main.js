"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => LatexPdfPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian3 = require("obsidian");

// src/templateRegistry.ts
var TEMPLATES = [
  {
    id: "kaobook",
    label: "Kaobook (book layout)",
    description: "Book-style LaTeX template based on the kaobook class, suitable for longer structured documents."
  },
  {
    id: "article",
    label: "Article",
    description: "Standard LaTeX article-style template, suitable for shorter papers and reports."
  }
];
function getAvailableTemplates() {
  return TEMPLATES;
}
function getTemplateById(id) {
  return TEMPLATES.find((t) => t.id === id);
}

// src/ui/TemplatePickerModal.ts
var import_obsidian = require("obsidian");
var TemplatePickerModal = class extends import_obsidian.Modal {
  constructor(app, options) {
    super(app);
    this.templates = options.templates;
    this.onSelect = options.onSelect;
    this.selectedId = options.initialTemplateId && this.templates.some((t) => t.id === options.initialTemplateId) ? options.initialTemplateId : this.templates[0]?.id;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: "Export to LaTeX PDF" });
    contentEl.createEl("p", {
      text: "Choose a LaTeX/Pandoc template to use for exporting this note."
    });
    new import_obsidian.Setting(contentEl).setName("Template").setDesc("Select the LaTeX template for this export.").addDropdown((dropdown) => {
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
    new import_obsidian.Setting(buttonBar).addButton((btn) => {
      btn.setButtonText("Cancel").onClick(() => {
        this.close();
      });
    }).addButton((btn) => {
      btn.setCta().setButtonText("Continue").onClick(() => {
        const selected = this.templates.find((t) => t.id === this.selectedId);
        if (selected) {
          this.onSelect(selected);
        }
        this.close();
      });
    });
  }
  onClose() {
    this.contentEl.empty();
  }
};

// src/ui/PrintModal.ts
var import_obsidian2 = require("obsidian");
var PrintModal = class extends import_obsidian2.Modal {
  constructor(app, options) {
    super(app);
    this.file = options.file;
    this.template = options.template;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: "LaTeX PDF export" });
    contentEl.createEl("p", {
      text: `Note: ${this.file.name}`
    });
    contentEl.createEl("p", {
      text: `Template: ${this.template.label} (${this.template.id})`
    });
    contentEl.createEl("p", {
      text: "Validation and pandoc/LaTeX export are not yet implemented. This modal is the anchor point where those steps will be executed."
    });
    const buttonBar = contentEl.createDiv({ cls: "latex-pdf-modal-buttons" });
    new import_obsidian2.Setting(buttonBar).addButton((btn) => {
      btn.setButtonText("Close").onClick(() => {
        this.close();
      });
    }).addExtraButton((btn) => {
      btn.setIcon("printer").setTooltip("Export (coming soon)").onClick(() => {
        this.close();
      });
    });
  }
  onClose() {
    this.contentEl.empty();
  }
};

// src/main.ts
var DEFAULT_SETTINGS = {
  pandocPath: "pandoc",
  pdfEngine: "xelatex",
  defaultTemplateId: "kaobook"
};
var LatexPdfPlugin = class extends import_obsidian3.Plugin {
  async onload() {
    console.log("Loading Obsidian LaTeX PDF plugin");
    await this.loadSettings();
    this.addCommand({
      id: "latex-pdf-export-with-template",
      name: "Export current note to LaTeX PDF (choose template)",
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        if (!file || file.extension !== "md") return false;
        if (!checking) {
          this.exportWithTemplate(file);
        }
        return true;
      }
    });
    this.addCommand({
      id: "latex-pdf-export-default",
      name: "Export current note to LaTeX PDF (default template)",
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        if (!file || file.extension !== "md") return false;
        if (!checking) {
          this.exportWithDefaultTemplate(file);
        }
        return true;
      }
    });
    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file) => {
        if (file instanceof import_obsidian3.TFile && file.extension === "md") {
          menu.addItem((item) => {
            item.setTitle("Export to LaTeX PDF...").setIcon("printer").onClick(() => {
              this.exportWithTemplate(file);
            });
          });
        }
      })
    );
    this.addSettingTab(new LatexPdfSettingTab(this.app, this));
  }
  onunload() {
    console.log("Unloading Obsidian LaTeX PDF plugin");
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  async exportWithTemplate(file) {
    const templates = getAvailableTemplates();
    if (!templates.length) {
      new import_obsidian3.Notice("No LaTeX templates are configured.");
      return;
    }
    const modal = new TemplatePickerModal(this.app, {
      templates,
      initialTemplateId: this.settings.defaultTemplateId,
      onSelect: (template) => {
        this.openPrintModal(file, template.id);
      }
    });
    modal.open();
  }
  async exportWithDefaultTemplate(file) {
    const template = getTemplateById(this.settings.defaultTemplateId);
    if (!template) {
      new import_obsidian3.Notice(
        `Default template '${this.settings.defaultTemplateId}' is not available. Please update the plugin settings.`
      );
      return;
    }
    this.openPrintModal(file, template.id);
  }
  openPrintModal(file, templateId) {
    const template = getTemplateById(templateId);
    if (!template) {
      new import_obsidian3.Notice(`Template '${templateId}' is not available.`);
      return;
    }
    const modal = new PrintModal(this.app, { file, template });
    modal.open();
  }
};
var LatexPdfSettingTab = class extends import_obsidian3.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Obsidian LaTeX PDF Settings" });
    new import_obsidian3.Setting(containerEl).setName("Pandoc executable path").setDesc("Path to the pandoc executable (leave as 'pandoc' if it is on your PATH).").addText(
      (text) => text.setPlaceholder("pandoc").setValue(this.plugin.settings.pandocPath).onChange(async (value) => {
        this.plugin.settings.pandocPath = value || "pandoc";
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian3.Setting(containerEl).setName("PDF engine").setDesc("LaTeX engine used by pandoc to generate PDFs.").addDropdown((dropdown) => {
      dropdown.addOption("xelatex", "XeLaTeX");
      dropdown.addOption("lualatex", "LuaLaTeX");
      dropdown.addOption("pdflatex", "pdfLaTeX");
      dropdown.setValue(this.plugin.settings.pdfEngine);
      dropdown.onChange(async (value) => {
        this.plugin.settings.pdfEngine = value;
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian3.Setting(containerEl).setName("Default template").setDesc("Template used when exporting without choosing.").addDropdown((dropdown) => {
      const templates = getAvailableTemplates();
      for (const tpl of templates) {
        dropdown.addOption(tpl.id, tpl.label);
      }
      const current = this.plugin.settings.defaultTemplateId;
      if (templates.some((t) => t.id === current)) {
        dropdown.setValue(current);
      } else if (templates.length > 0) {
        dropdown.setValue(templates[0].id);
      }
      dropdown.onChange(async (value) => {
        this.plugin.settings.defaultTemplateId = value;
        await this.plugin.saveSettings();
      });
    });
  }
};
//# sourceMappingURL=main.js.map
