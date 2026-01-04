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

type ExportBackend = "direct" | "pandoc-plugin";

interface LatexPdfPluginSettings {
  pandocPath: string;
  pdfEngine: "xelatex" | "lualatex" | "pdflatex";
  defaultTemplateId: string;
  exportBackend: ExportBackend;
  pandocCommandId: string; // command ID from the existing Pandoc plugin
}

const DEFAULT_SETTINGS: LatexPdfPluginSettings = {
  pandocPath: "pandoc",
  pdfEngine: "xelatex",
  defaultTemplateId: "kaobook",
  exportBackend: "pandoc-plugin",
  pandocCommandId: "",
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
        if (this.settings.exportBackend === "pandoc-plugin") {
          const cmdId = this.settings.pandocCommandId;
          if (!cmdId) {
            new Notice(
              "No Pandoc plugin command configured. Set it in the Obsidian LaTeX PDF settings.",
            );
            return;
          }
          const ok = this.app.commands.executeCommandById(cmdId);
          if (!ok) {
            new Notice(
              `Could not execute Pandoc plugin command '${cmdId}'. Check that the Pandoc plugin is installed and the command ID is correct.`,
            );
          }
        } else {
          await exportNoteToPdf(this.app, file, template, {
            pandocPath: this.settings.pandocPath,
            pdfEngine: this.settings.pdfEngine,
          });
        }
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

    // Export backend selection
    new Setting(containerEl)
      .setName("Export backend")
      .setDesc(
        "Choose whether to call pandoc directly or delegate to the existing Pandoc plugin.",
      )
      .addDropdown((dropdown) => {
        dropdown.addOption("pandoc-plugin", "Use Pandoc plugin (recommended)");
        dropdown.addOption("direct", "Direct pandoc (experimental)");
        dropdown.setValue(this.plugin.settings.exportBackend);
        dropdown.onChange(async (value: ExportBackend) => {
          this.plugin.settings.exportBackend = value;
          await this.plugin.saveSettings();
          this.display(); // re-render to update backend-specific options
        });
      });

    // Direct pandoc settings (only relevant when using the direct backend)
    new Setting(containerEl)
      .setName("Pandoc executable path")
      .setDesc(
        "Path to the pandoc executable (used for the direct backend; ignored when using the Pandoc plugin backend).",
      )
      .addText((text) =>
        text
          .setPlaceholder("pandoc")
          .setValue(this.plugin.settings.pandocPath)
          .onChange(async (value) => {
            this.plugin.settings.pandocPath = value || "pandoc";
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("PDF engine")
      .setDesc("LaTeX engine used by pandoc to generate PDFs (direct backend only).")
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

    // Default template selection
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

    // When using the Pandoc plugin backend, let the user select the command to execute.
    if (this.plugin.settings.exportBackend === "pandoc-plugin") {
      const commands = this.app.commands
        .listCommands()
        .filter((c) => c.name.toLowerCase().includes("pandoc"));

      const description = commands.length
        ? "Select the Pandoc plugin command that generates a PDF (as configured in the Pandoc plugin)."
        : "No commands containing 'pandoc' were found. Ensure the Pandoc plugin is installed and enabled.";

      new Setting(containerEl)
        .setName("Pandoc plugin command")
        .setDesc(description)
        .addDropdown((dropdown) => {
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
}
