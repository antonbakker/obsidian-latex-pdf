import {
  App,
  Menu,
  Plugin,
  PluginSettingTab,
  Setting,
  Notice,
  TAbstractFile,
  TFile,
} from "obsidian";
import { getAvailableTemplates, getTemplateById } from "./templateRegistry";
import { TemplatePickerModal } from "./ui/TemplatePickerModal";
import { PrintModal } from "./ui/PrintModal";
import { exportNoteToPdf } from "./exportRunner";

interface LatexPdfPluginSettings {
  pandocPath: string;
  pdfEngine: "xelatex" | "lualatex" | "pdflatex";
  defaultTemplateId: string;
}

const DEFAULT_SETTINGS: LatexPdfPluginSettings = {
  pandocPath: "pandoc",
  pdfEngine: "xelatex",
  defaultTemplateId: "kaobook",
};

export default class LatexPdfPlugin extends Plugin {
  settings: LatexPdfPluginSettings;

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
      },
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
      },
    });

    // Add to file/note "More options" (file-menu) for markdown files.
    this.registerEvent(
      this.app.workspace.on("file-menu", (menu: Menu, file: TAbstractFile) => {
        if (file instanceof TFile && file.extension === "md") {
          menu.addItem((item) => {
            item
              .setTitle("Export to LaTeX PDF...")
              .setIcon("printer")
              .onClick(() => {
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

  private async exportWithTemplate(file: TFile) {
    const templates = getAvailableTemplates();
    if (!templates.length) {
      new Notice("No LaTeX templates are configured.");
      return;
    }

    const modal = new TemplatePickerModal(this.app, {
      templates,
      initialTemplateId: this.settings.defaultTemplateId,
      onSelect: (template) => {
        this.openPrintModal(file, template.id);
      },
    });
    modal.open();
  }

  private async exportWithDefaultTemplate(file: TFile) {
    const template = getTemplateById(this.settings.defaultTemplateId);
    if (!template) {
      new Notice(
        `Default template '${this.settings.defaultTemplateId}' is not available. Please update the plugin settings.`,
      );
      return;
    }
    this.openPrintModal(file, template.id);
  }

  private openPrintModal(file: TFile, templateId: string) {
    const template = getTemplateById(templateId);
    if (!template) {
      new Notice(`Template '${templateId}' is not available.`);
      return;
    }

    const modal = new PrintModal(this.app, {
      file,
      template,
      onExport: async () => {
        await exportNoteToPdf(this.app, file, template, {
          pandocPath: this.settings.pandocPath,
          pdfEngine: this.settings.pdfEngine,
        });
      },
    });
    modal.open();
  }
}

class LatexPdfSettingTab extends PluginSettingTab {
  plugin: LatexPdfPlugin;

  constructor(app: App, plugin: LatexPdfPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Obsidian LaTeX PDF Settings" });

    new Setting(containerEl)
      .setName("Pandoc executable path")
      .setDesc("Path to the pandoc executable (leave as 'pandoc' if it is on your PATH).")
      .addText((text) =>
        text
          .setPlaceholder("pandoc")
          .setValue(this.plugin.settings.pandocPath)
          .onChange(async (value) => {
            this.plugin.settings.pandocPath = value || "pandoc";
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("PDF engine")
      .setDesc("LaTeX engine used by pandoc to generate PDFs.")
      .addDropdown((dropdown) => {
        dropdown.addOption("xelatex", "XeLaTeX");
        dropdown.addOption("lualatex", "LuaLaTeX");
        dropdown.addOption("pdflatex", "pdfLaTeX");
        dropdown.setValue(this.plugin.settings.pdfEngine);
        dropdown.onChange(async (value: "xelatex" | "lualatex" | "pdflatex") => {
          this.plugin.settings.pdfEngine = value;
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName("Default template")
      .setDesc("Template used when exporting without choosing.")
      .addDropdown((dropdown) => {
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
}
