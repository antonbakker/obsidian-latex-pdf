"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => LatexPdfPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian4 = require("obsidian");

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
    this.onExport = options.onExport;
    this.outputFolder = options.initialOutputFolder;
    this.outputFilename = options.initialOutputFilename;
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
      text: "Choose where to store the generated PDF (inside your vault), then click Export."
    });
    new import_obsidian2.Setting(contentEl).setName("Output folder (in vault)").setDesc("Vault-relative folder path, e.g. 'Exports' or 'notes/exports'.").addText((text) => {
      text.setPlaceholder("Exports").setValue(this.outputFolder).onChange((value) => {
        this.outputFolder = value;
      });
    });
    new import_obsidian2.Setting(contentEl).setName("Output filename").setDesc("Filename without extension. '.pdf' will be added automatically.").addText((text) => {
      text.setPlaceholder(this.file.basename).setValue(this.outputFilename).onChange((value) => {
        this.outputFilename = value;
      });
    });
    const buttonBar = contentEl.createDiv({ cls: "latex-pdf-modal-buttons" });
    new import_obsidian2.Setting(buttonBar).addButton((btn) => {
      btn.setButtonText("Close").onClick(() => {
        this.close();
      });
    }).addExtraButton((btn) => {
      btn.setIcon("printer").setTooltip("Export to LaTeX PDF").onClick(() => {
        this.onExport({
          outputFolder: this.outputFolder,
          outputFilename: this.outputFilename
        });
      });
    });
  }
  onClose() {
    this.contentEl.empty();
  }
};

// src/exportRunner.ts
var import_obsidian3 = require("obsidian");
var import_util = require("util");
var import_child_process = require("child_process");
var fs = __toESM(require("fs/promises"));
var os = __toESM(require("os"));
var path = __toESM(require("path"));
var execFileAsync = (0, import_util.promisify)(import_child_process.execFile);
async function exportNoteToPdf(app, file, template, settings, target) {
  const { pandocPath, pdfEngine } = settings;
  const content = await app.vault.read(file);
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "obsidian-latex-pdf-"));
  const inputPath = path.join(tempDir, "input.md");
  const outputPath = path.join(tempDir, "output.pdf");
  await fs.writeFile(inputPath, content, "utf8");
  const args = [
    inputPath,
    "--from=markdown+tex_math_dollars+raw_tex+link_attributes",
    "--pdf-engine",
    pdfEngine,
    // TODO: wire real pandoc template file per TemplateDefinition.
    "-o",
    outputPath
  ];
  try {
    await execFileAsync(pandocPath, args, { cwd: tempDir });
  } catch (error) {
    console.error("Pandoc export failed", error);
    new import_obsidian3.Notice("LaTeX PDF export failed. Check console for details.");
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
      if (existing instanceof import_obsidian3.TFile) {
        await vault.modifyBinary(existing, pdfBytes);
      } else {
        await vault.createBinary(vaultPath, pdfBytes);
      }
      new import_obsidian3.Notice(`LaTeX PDF exported to: ${vaultPath}`);
    } catch (error) {
      console.error("Failed to copy LaTeX PDF into vault", error);
      new import_obsidian3.Notice("LaTeX PDF was generated, but copying into the vault failed.");
    }
  } else {
    new import_obsidian3.Notice(`LaTeX PDF exported to temporary file: ${outputPath}`);
  }
}

// src/main.ts
var DEFAULT_SETTINGS = {
  pandocPath: "pandoc",
  pdfEngine: "xelatex",
  defaultTemplateId: "kaobook",
  exportBackend: "pandoc-plugin",
  pandocCommandId: ""
};
var LatexPdfPlugin = class extends import_obsidian4.Plugin {
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
        if (file instanceof import_obsidian4.TFile && file.extension === "md") {
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
      new import_obsidian4.Notice("No LaTeX templates are configured.");
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
      new import_obsidian4.Notice(
        `Default template '${this.settings.defaultTemplateId}' is not available. Please update the plugin settings.`
      );
      return;
    }
    this.openPrintModal(file, template.id);
  }
  openPrintModal(file, templateId) {
    const template = getTemplateById(templateId);
    if (!template) {
      new import_obsidian4.Notice(`Template '${templateId}' is not available.`);
      return;
    }
    const defaultFolder = file.parent?.path ?? "Exports";
    const defaultFilename = `${file.basename}-${template.id}`;
    const modal = new PrintModal(this.app, {
      file,
      template,
      initialOutputFolder: defaultFolder,
      initialOutputFilename: defaultFilename,
      onExport: async ({ outputFolder, outputFilename }) => {
        if (this.settings.exportBackend === "pandoc-plugin") {
          const cmdId = this.settings.pandocCommandId;
          if (!cmdId) {
            new import_obsidian4.Notice(
              "No Pandoc plugin command configured. Set it in the Obsidian LaTeX PDF settings."
            );
            return;
          }
          const ok = this.app.commands.executeCommandById(cmdId);
          if (!ok) {
            new import_obsidian4.Notice(
              `Could not execute Pandoc plugin command '${cmdId}'. Check that the Pandoc plugin is installed and the command ID is correct.`
            );
          }
        } else {
          const folder = outputFolder?.trim() || defaultFolder;
          const baseName = outputFilename?.trim() || defaultFilename;
          const vaultPath = folder ? `${folder}/${baseName}.pdf` : `${baseName}.pdf`;
          await exportNoteToPdf(
            this.app,
            file,
            template,
            {
              pandocPath: this.settings.pandocPath,
              pdfEngine: this.settings.pdfEngine
            },
            { vaultPath }
          );
        }
      }
    });
    modal.open();
  }
};
var LatexPdfSettingTab = class extends import_obsidian4.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Obsidian LaTeX PDF Settings" });
    new import_obsidian4.Setting(containerEl).setName("Export backend").setDesc(
      "Choose whether to call pandoc directly or delegate to the existing Pandoc plugin."
    ).addDropdown((dropdown) => {
      dropdown.addOption("pandoc-plugin", "Use Pandoc plugin (recommended)");
      dropdown.addOption("direct", "Direct pandoc (experimental)");
      dropdown.setValue(this.plugin.settings.exportBackend);
      dropdown.onChange(async (value) => {
        this.plugin.settings.exportBackend = value;
        await this.plugin.saveSettings();
        this.display();
      });
    });
    new import_obsidian4.Setting(containerEl).setName("Pandoc executable path").setDesc(
      "Path to the pandoc executable (used for the direct backend; ignored when using the Pandoc plugin backend)."
    ).addText(
      (text) => text.setPlaceholder("pandoc").setValue(this.plugin.settings.pandocPath).onChange(async (value) => {
        this.plugin.settings.pandocPath = value || "pandoc";
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian4.Setting(containerEl).setName("PDF engine").setDesc("LaTeX engine used by pandoc to generate PDFs (direct backend only).").addDropdown((dropdown) => {
      dropdown.addOption("xelatex", "XeLaTeX");
      dropdown.addOption("lualatex", "LuaLaTeX");
      dropdown.addOption("pdflatex", "pdfLaTeX");
      dropdown.setValue(this.plugin.settings.pdfEngine);
      dropdown.onChange(async (value) => {
        this.plugin.settings.pdfEngine = value;
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian4.Setting(containerEl).setName("Default template").setDesc("Template used when exporting without choosing.").addDropdown((dropdown) => {
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
    if (this.plugin.settings.exportBackend === "pandoc-plugin") {
      const commands = this.app.commands.listCommands().filter((c) => c.name.toLowerCase().includes("pandoc"));
      const description = commands.length ? "Select the Pandoc plugin command that generates a PDF (as configured in the Pandoc plugin)." : "No commands containing 'pandoc' were found. Ensure the Pandoc plugin is installed and enabled.";
      new import_obsidian4.Setting(containerEl).setName("Pandoc plugin command").setDesc(description).addDropdown((dropdown) => {
        if (!commands.length) {
          dropdown.addOption("", "No Pandoc commands detected");
          dropdown.setDisabled(true);
          return;
        }
        for (const cmd of commands) {
          dropdown.addOption(cmd.id, cmd.name);
        }
        const current = this.plugin.settings.pandocCommandId;
        if (current && commands.some((c) => c.id === current)) {
          dropdown.setValue(current);
        } else {
          dropdown.setValue(commands[0].id);
        }
        dropdown.onChange(async (value) => {
          this.plugin.settings.pandocCommandId = value;
          await this.plugin.saveSettings();
        });
      });
    }
  }
};
//# sourceMappingURL=main.js.map
