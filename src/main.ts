import { App, Plugin, PluginSettingTab, Setting, Notice, TFile } from "obsidian";

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
    // TODO: open template picker modal, run validation, then export.
    new Notice("Template picker and validation not implemented yet.");
  }

  private async exportWithDefaultTemplate(file: TFile) {
    // TODO: run validation and export using default template.
    new Notice(`Exporting '${file.name}' with default template '${this.settings.defaultTemplateId}' is not implemented yet.`);
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
      .setName("Default template ID")
      .setDesc("ID of the LaTeX/Pandoc template to use when exporting without choosing.")
      .addText((text) =>
        text
          .setPlaceholder("kaobook")
          .setValue(this.plugin.settings.defaultTemplateId)
          .onChange(async (value) => {
            this.plugin.settings.defaultTemplateId = value || "kaobook";
            await this.plugin.saveSettings();
          })
      );
  }
}
