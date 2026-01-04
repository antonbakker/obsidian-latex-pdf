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
var import_obsidian = require("obsidian");
var DEFAULT_SETTINGS = {
  pandocPath: "pandoc",
  pdfEngine: "xelatex",
  defaultTemplateId: "kaobook"
};
var LatexPdfPlugin = class extends import_obsidian.Plugin {
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
    new import_obsidian.Notice("Template picker and validation not implemented yet.");
  }
  async exportWithDefaultTemplate(file) {
    new import_obsidian.Notice(`Exporting '${file.name}' with default template '${this.settings.defaultTemplateId}' is not implemented yet.`);
  }
};
var LatexPdfSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Obsidian LaTeX PDF Settings" });
    new import_obsidian.Setting(containerEl).setName("Pandoc executable path").setDesc("Path to the pandoc executable (leave as 'pandoc' if it is on your PATH).").addText(
      (text) => text.setPlaceholder("pandoc").setValue(this.plugin.settings.pandocPath).onChange(async (value) => {
        this.plugin.settings.pandocPath = value || "pandoc";
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("PDF engine").setDesc("LaTeX engine used by pandoc to generate PDFs.").addDropdown((dropdown) => {
      dropdown.addOption("xelatex", "XeLaTeX");
      dropdown.addOption("lualatex", "LuaLaTeX");
      dropdown.addOption("pdflatex", "pdfLaTeX");
      dropdown.setValue(this.plugin.settings.pdfEngine);
      dropdown.onChange(async (value) => {
        this.plugin.settings.pdfEngine = value;
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian.Setting(containerEl).setName("Default template ID").setDesc("ID of the LaTeX/Pandoc template to use when exporting without choosing.").addText(
      (text) => text.setPlaceholder("kaobook").setValue(this.plugin.settings.defaultTemplateId).onChange(async (value) => {
        this.plugin.settings.defaultTemplateId = value || "kaobook";
        await this.plugin.saveSettings();
      })
    );
  }
};
//# sourceMappingURL=main.js.map
