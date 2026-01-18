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
    id: "article",
    label: "Article (A4)",
    description: "Standard A4 article-style template based on KOMA scrartcl, suitable for shorter papers and reports.",
    kind: "article",
    pandocTemplateRelativePath: "templates/article/template.tex"
  },
  {
    id: "report",
    label: "Report (A4)",
    description: "Standard A4 report-style template based on KOMA scrreprt, suitable for longer technical reports.",
    kind: "report",
    pandocTemplateRelativePath: "templates/report/template.tex"
  },
  {
    id: "kaobook",
    label: "Kaobook (book layout, A4)",
    description: "Book-style A4 template based on the kaobook class, suitable for books and long structured documents.",
    kind: "book",
    pandocTemplateRelativePath: "templates/kaobook/template.tex"
  },
  {
    id: "thesis-kaobook",
    label: "Thesis (kaobook, A4)",
    description: "Thesis/dissertation template built on kaobook, with abstract and acknowledgements front matter.",
    kind: "thesis",
    pandocTemplateRelativePath: "templates/thesis-kaobook/template.tex"
  },
  {
    id: "letter",
    label: "Letter (A4, scrlttr2)",
    description: "Business letter template based on KOMA-Script scrlttr2, suitable for A4 correspondence.",
    kind: "letter",
    pandocTemplateRelativePath: "templates/letter/template.tex"
  },
  {
    id: "memo",
    label: "Memo (A4)",
    description: "Minimal A4 memo template with clear header (to/from/date/subject) suitable for internal notes.",
    kind: "article",
    pandocTemplateRelativePath: "templates/memo/template.tex"
  },
  {
    id: "ieee-proposal",
    label: "IEEE Proposal (conference)",
    description: "IEEE-style conference proposal template based on IEEEtran, suitable for technical or research proposals.",
    kind: "article",
    pandocTemplateRelativePath: "templates/ieee-proposal/template.tex"
  },
  {
    id: "business-plan",
    label: "Business Plan (A4 report)",
    description: "Business plan template with a structured title page (company, authors, version) and optional executive summary, based on KOMA scrreprt.",
    kind: "report",
    pandocTemplateRelativePath: "templates/business-plan/template.tex"
  },
  {
    id: "koma-proposal",
    label: "Proposal (KOMA-Script, A4)",
    description: "General A4 proposal template based on KOMA scrartcl with a structured client/project header.",
    kind: "report",
    pandocTemplateRelativePath: "templates/koma-proposal/template.tex"
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
    this.validation = options.validation;
    this.onExport = options.onExport;
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
      text: "Review the note and template, then click Export to generate a PDF using your local pandoc and LaTeX installation."
    });
    if (this.validation) {
      const box = contentEl.createDiv({ cls: "latex-pdf-validation" });
      const { issues, isValid: isValid2 } = this.validation;
      box.createEl("h3", { text: "Template validation" });
      if (!issues.length) {
        box.createEl("p", { text: "No validation issues detected for this template." });
      } else {
        const errorCount = issues.filter((i) => i.level === "error").length;
        const warningCount = issues.filter((i) => i.level === "warning").length;
        const summary = isValid2 ? `Validation completed with ${warningCount} warning(s).` : `Validation found ${errorCount} error(s) and ${warningCount} warning(s). Fix errors before exporting if possible.`;
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
    new import_obsidian2.Setting(buttonBar).addButton((btn) => {
      btn.setButtonText("Close").onClick(() => {
        this.close();
      });
    }).addExtraButton((btn) => {
      btn.setIcon("printer").setTooltip(
        isValid ? "Export to LaTeX PDF" : "Fix validation errors before exporting to LaTeX PDF"
      );
      if (hasValidation && !isValid) {
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
  onClose() {
    this.contentEl.empty();
  }
};

// src/exportRunner.ts
var import_obsidian3 = require("obsidian");

// src/pandocRunner.ts
var import_util = require("util");
var import_child_process = require("child_process");
var fs = __toESM(require("fs/promises"));
var os = __toESM(require("os"));
var path = __toESM(require("path"));
var execFileAsync = (0, import_util.promisify)(import_child_process.execFile);
function isAbsolutePath(p) {
  return path.isAbsolute(p) || /^[A-Za-z]:[\\/]/.test(p);
}
function injectNoteTitleHeadingIfMissing(content, noteTitle) {
  let lines = content.split(/\r?\n/);
  if (lines.length === 0) {
    return `# ${noteTitle}`;
  }
  if (lines[0].trim() === "---") {
    let fmEnd = -1;
    let hasTitle = false;
    for (let i = 1; i < lines.length; i += 1) {
      const line = lines[i];
      if (/^title\s*:/.test(line)) {
        hasTitle = true;
      }
      if (line.trim() === "---") {
        fmEnd = i;
        break;
      }
    }
    if (fmEnd !== -1 && !hasTitle) {
      const beforeFm = lines.slice(0, fmEnd + 1);
      const afterFm = lines.slice(fmEnd + 1);
      const safeTitle = noteTitle.replace(/"/g, '\\"');
      const titleLine = `title: "${safeTitle}"`;
      const newFrontmatter = [beforeFm[0], titleLine, ...beforeFm.slice(1)];
      lines = [...newFrontmatter, ...afterFm];
    }
  }
  let index = 0;
  let inFrontmatter = false;
  if (lines[0].trim() === "---") {
    inFrontmatter = true;
    index = 1;
    while (index < lines.length) {
      if (lines[index].trim() === "---") {
        index += 1;
        break;
      }
      index += 1;
    }
  }
  let firstHeadingLevel = null;
  for (let i = index; i < lines.length; i += 1) {
    const line = lines[i];
    const match = /^(#{1,6})\s+/.exec(line);
    if (match) {
      firstHeadingLevel = match[1].length;
      break;
    }
  }
  if (firstHeadingLevel === 1) {
    return content;
  }
  const headingLine = `# ${noteTitle}`;
  if (inFrontmatter) {
    const before = lines.slice(0, index);
    const after = lines.slice(index);
    if (after.length > 0 && after[0].trim() === "") {
      const newBody2 = [headingLine, ...after];
      return [...before, ...newBody2].join("\n");
    }
    const newBody = [headingLine, "", ...after];
    return [...before, ...newBody].join("\n");
  }
  return [headingLine, "", ...lines].join("\n");
}
function transformCallouts(content) {
  const lines = content.split(/\r?\n/);
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const calloutMatch = /^>\s*\[!([A-Za-z0-9_-]+)\]\s*(.*)$/.exec(line);
    if (!calloutMatch) {
      out.push(line);
      i += 1;
      continue;
    }
    const rawType = calloutMatch[1].toLowerCase();
    const titleText = calloutMatch[2].trim();
    let env = "callout-note";
    switch (rawType) {
      case "info":
      case "note":
        env = "callout-info";
        break;
      case "warning":
      case "caution":
        env = "callout-warning";
        break;
      case "tip":
      case "success":
        env = "callout-tip";
        break;
      default:
        env = "callout-note";
        break;
    }
    if (titleText.length > 0) {
      out.push(`\\begin{${env}}[${titleText}]`);
    } else {
      out.push(`\\begin{${env}}`);
    }
    i += 1;
    while (i < lines.length) {
      const bodyLine = lines[i];
      if (!bodyLine.startsWith(">")) break;
      out.push(bodyLine.replace(/^>\s?/, ""));
      i += 1;
    }
    out.push(`\\end{${env}}`);
  }
  return out.join("\n");
}
async function preprocessNoteToTempFile(app, file, settings) {
  const rawContent = await app.vault.read(file);
  const withHeading = injectNoteTitleHeadingIfMissing(rawContent, file.basename);
  const contentWithHeading = transformCallouts(withHeading);
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "obsidian-latex-pdf-"));
  const inputPath = path.join(tempDir, "input.md");
  await fs.writeFile(inputPath, contentWithHeading, "utf8");
  let headerTexPath;
  if (settings.enableLatexProfiles && settings.latexProfileBaseDir) {
    const cache = app.metadataCache.getFileCache(file);
    const fm = cache?.frontmatter;
    const rawProfile = fm?.["latex_pdf_profile"];
    if (typeof rawProfile === "string" && rawProfile.trim().length > 0) {
      const profileId = rawProfile.trim();
      const baseDir = settings.latexProfileBaseDir;
      const vaultBasePath = app.vault.adapter?.basePath;
      let baseAbs;
      if (isAbsolutePath(baseDir)) {
        baseAbs = baseDir;
      } else if (vaultBasePath) {
        baseAbs = path.join(vaultBasePath, baseDir);
      }
      if (baseAbs) {
        const candidate = path.join(baseAbs, profileId, "preamble.tex");
        try {
          await fs.access(candidate);
          headerTexPath = candidate;
        } catch {
        }
      }
    }
  }
  return { inputPath, tempDir, headerTexPath };
}
async function runPandocToPdf(opts) {
  const { app, file, template, settings } = opts;
  const { pandocPath, pdfEngine, pdfEngineBinary } = settings;
  const engineCommand = pdfEngineBinary && pdfEngineBinary.trim().length > 0 ? pdfEngineBinary : pdfEngine;
  const { inputPath, tempDir, headerTexPath } = await preprocessNoteToTempFile(app, file, settings);
  const notePath = file.path;
  const noteDir = notePath.includes("/") ? notePath.substring(0, notePath.lastIndexOf("/")) : "";
  const noteBase = file.basename;
  const vaultBasePath = app.vault.adapter?.basePath;
  const outputDir = vaultBasePath && noteDir ? path.join(vaultBasePath, noteDir) : vaultBasePath || tempDir;
  const outputPath = path.join(outputDir, `${noteBase}.pdf`);
  const args = [
    inputPath,
    "--from=markdown+tex_math_dollars+raw_tex+link_attributes",
    "--pdf-engine",
    engineCommand
    // Enable Pandoc's default syntax highlighting so code blocks are highlighted in the output.
  ];
  if (template.pandocTemplateRelativePath) {
    const pluginTemplateBase = "/Users/anton/Development/989646093931/obsidian-latex-pdf";
    const templatePath = path.join(pluginTemplateBase, template.pandocTemplateRelativePath);
    args.push("--template", templatePath);
  }
  const calloutsPreamble = "/Users/anton/Development/989646093931/obsidian-latex-pdf/templates/common/callouts.tex";
  args.push("--include-in-header", calloutsPreamble);
  if (headerTexPath) {
    args.push("--include-in-header", headerTexPath);
  }
  args.push("-o", outputPath);
  await execFileAsync(pandocPath, args, { cwd: tempDir });
  return outputPath;
}

// src/exportRunner.ts
var fs2 = __toESM(require("fs/promises"));
var path2 = __toESM(require("path"));
async function exportNoteToPdf(app, file, template, settings) {
  try {
    const outputPath = await runPandocToPdf({
      app,
      file,
      template,
      settings
    });
    new import_obsidian3.Notice(`LaTeX PDF exported: ${outputPath}`);
  } catch (error) {
    console.error("Pandoc export failed", error);
    new import_obsidian3.Notice("LaTeX PDF export failed. Check console for details.");
  }
}
async function exportNoteViaService(app, file, template, settings) {
  const baseUrl = (settings.baseUrl || "").trim();
  if (!baseUrl) {
    new import_obsidian3.Notice("Remote service base URL is not configured. Set it in the LaTeX PDF settings.");
    return;
  }
  try {
    const content = await app.vault.read(file);
    const encoder = new TextEncoder();
    const utf8 = encoder.encode(content);
    const sizeBytes = utf8.length;
    const JSON_THRESHOLD = 1024 * 1024;
    const base = baseUrl.replace(/\/+$/, "");
    const headers = {};
    if (settings.jwtToken) {
      headers["Authorization"] = `Bearer ${settings.jwtToken}`;
    }
    let pdfBuffer;
    if (sizeBytes <= JSON_THRESHOLD) {
      const url = `${base}/render-json`;
      const response = await (0, import_obsidian3.requestUrl)({
        url,
        method: "POST",
        body: JSON.stringify({
          content,
          format: "markdown",
          output: "pdf",
          options: { templateId: template.id }
        }),
        headers: {
          ...headers,
          "Content-Type": "application/json"
        }
      });
      const arrayBuffer = response.arrayBuffer;
      pdfBuffer = Buffer.from(arrayBuffer);
    } else {
      const initUrl = `${base}/init-upload`;
      const initResp = await (0, import_obsidian3.requestUrl)({
        url: initUrl,
        method: "POST",
        body: JSON.stringify({
          fileName: `${file.basename}.md`,
          contentType: "text/markdown; charset=utf-8",
          expectedSizeBytes: sizeBytes
        }),
        headers: {
          ...headers,
          "Content-Type": "application/json"
        }
      });
      const initBody = initResp.json;
      await (0, import_obsidian3.requestUrl)({
        url: initBody.uploadUrl,
        method: "PUT",
        body: content,
        headers: {
          "Content-Type": "text/markdown; charset=utf-8"
        }
      });
      const renderUrl = `${base}/render-from-s3`;
      const renderResp = await (0, import_obsidian3.requestUrl)({
        url: renderUrl,
        method: "POST",
        body: JSON.stringify({
          bucket: initBody.bucket,
          key: initBody.objectKey,
          format: "markdown",
          output: "pdf",
          options: { templateId: template.id }
        }),
        headers: {
          ...headers,
          "Content-Type": "application/json"
        }
      });
      const renderArrayBuffer = renderResp.arrayBuffer;
      pdfBuffer = Buffer.from(renderArrayBuffer);
    }
    const notePath = file.path;
    const noteDir = notePath.includes("/") ? notePath.substring(0, notePath.lastIndexOf("/")) : "";
    const noteBase = file.basename;
    const vaultBasePath = app.vault.adapter?.basePath;
    if (!vaultBasePath) {
      new import_obsidian3.Notice("Cannot resolve vault base path to write PDF.");
      return;
    }
    const outputDir = noteDir ? path2.join(vaultBasePath, noteDir) : vaultBasePath;
    const outputPath = path2.join(outputDir, `${noteBase}.pdf`);
    await fs2.writeFile(outputPath, pdfBuffer);
    new import_obsidian3.Notice(`Remote LaTeX PDF exported: ${outputPath}`);
  } catch (error) {
    console.error("Remote export failed", error);
    new import_obsidian3.Notice("Remote LaTeX PDF export failed. Check console for details.");
  }
}

// src/validation/frontmatterSchema.ts
var SCHEMA_BY_TEMPLATE_ID = {
  // Article (A4) template – templates/article/template.tex
  article: {
    templateId: "article",
    label: "Article (A4)",
    fields: [
      {
        key: "title",
        type: "string",
        missingSeverity: "error",
        messageOnMissing: "Missing 'title' in frontmatter. Add a title: <string> to identify the article."
      },
      {
        key: "author",
        type: "string|string[]",
        missingSeverity: "warning",
        messageOnMissing: "Missing 'author' in frontmatter. It is recommended to set an author for academic or formal documents."
      },
      {
        key: "date",
        type: "date-string",
        missingSeverity: "ignore",
        messageOnMissing: "Optional 'date' is not set. The template will default to today's date if omitted."
      },
      {
        key: "abstract",
        type: "markdown-string",
        missingSeverity: "ignore",
        messageOnMissing: "Optional 'abstract' is not set. You can add a short summary using an 'abstract' field."
      },
      {
        key: "client",
        type: "string",
        missingSeverity: "ignore",
        messageOnMissing: "Optional 'client' is not set. Set it only when you need a client-specific LaTeX preamble."
      }
    ]
  },
  // Report (A4) template – templates/report/template.tex
  report: {
    templateId: "report",
    label: "Report (A4)",
    fields: [
      {
        key: "title",
        type: "string",
        missingSeverity: "error",
        messageOnMissing: "Missing 'title' in frontmatter. Add a title: <string> to identify the report."
      },
      {
        key: "author",
        type: "string|string[]",
        missingSeverity: "warning",
        messageOnMissing: "Missing 'author' in frontmatter. It is recommended to list report authors."
      },
      {
        key: "date",
        type: "date-string",
        missingSeverity: "ignore",
        messageOnMissing: "Optional 'date' is not set. The template will default to today's date if omitted."
      },
      {
        key: "abstract",
        type: "markdown-string",
        missingSeverity: "warning",
        messageOnMissing: "Report template: 'abstract' is not set. Add an 'abstract' field to provide a short summary."
      },
      {
        key: "client",
        type: "string",
        missingSeverity: "ignore",
        messageOnMissing: "Optional 'client' is not set. Set it only when you need a client-specific LaTeX preamble."
      }
      // Fields like subtitle/keywords are documented in examples but currently
      // not enforced by validation.
    ]
  },
  // Kaobook book template – templates/kaobook/template.tex
  kaobook: {
    templateId: "kaobook",
    label: "Kaobook (book layout, A4)",
    fields: [
      {
        key: "title",
        type: "string",
        missingSeverity: "error",
        messageOnMissing: "Missing 'title' in frontmatter. Add a title: <string> to identify the book."
      },
      {
        key: "subtitle",
        type: "string",
        missingSeverity: "ignore",
        messageOnMissing: "Optional 'subtitle' is not set. You can add a 'subtitle' to appear under the main title."
      },
      {
        key: "author",
        type: "string|string[]",
        missingSeverity: "warning",
        messageOnMissing: "Missing 'author' in frontmatter. It is recommended to list book authors."
      },
      {
        key: "date",
        type: "date-string",
        missingSeverity: "ignore",
        messageOnMissing: "Optional 'date' is not set. The template will default to today's date if omitted."
      },
      {
        key: "abstract",
        type: "markdown-string",
        missingSeverity: "warning",
        messageOnMissing: "Book template: 'abstract' is not set. Add an 'abstract' field to summarise the work."
      },
      {
        key: "client",
        type: "string",
        missingSeverity: "ignore",
        messageOnMissing: "Optional 'client' is not set. Set it only when you need a client-specific LaTeX preamble."
      }
    ]
  },
  // Thesis kaobook template – templates/thesis-kaobook/template.tex
  "thesis-kaobook": {
    templateId: "thesis-kaobook",
    label: "Thesis (kaobook, A4)",
    fields: [
      {
        key: "title",
        type: "string",
        missingSeverity: "error",
        messageOnMissing: "Missing 'title' in frontmatter. A thesis must have a clear title."
      },
      {
        key: "author",
        type: "string|string[]",
        missingSeverity: "error",
        messageOnMissing: "Missing 'author' in frontmatter. A thesis must declare its author."
      },
      {
        key: "university",
        type: "string",
        missingSeverity: "error",
        messageOnMissing: "Thesis template: 'university' is not set in frontmatter. Add university: <name> to identify the institution."
      },
      {
        key: "subtitle",
        type: "string",
        missingSeverity: "ignore",
        messageOnMissing: "Optional 'subtitle' is not set. You can add a 'subtitle' for additional context."
      },
      {
        key: "date",
        type: "date-string",
        missingSeverity: "ignore",
        messageOnMissing: "Optional 'date' is not set. The template will default to today's date if omitted."
      },
      {
        key: "abstract",
        type: "markdown-string",
        missingSeverity: "error",
        messageOnMissing: "Thesis template: 'abstract' is not set. Add an 'abstract' field in frontmatter to provide a summary."
      },
      {
        key: "acknowledgements",
        type: "markdown-string",
        missingSeverity: "ignore",
        messageOnMissing: "Optional 'acknowledgements' is not set. You can add acknowledgements if desired."
      },
      {
        key: "client",
        type: "string",
        missingSeverity: "ignore",
        messageOnMissing: "Optional 'client' is not set. Set it only when you need a client-specific LaTeX preamble."
      }
    ]
  },
  // Letter (A4, scrlttr2) template – templates/letter/template.tex
  letter: {
    templateId: "letter",
    label: "Letter (A4, scrlttr2)",
    fields: [
      {
        key: "title",
        type: "string",
        missingSeverity: "warning",
        messageOnMissing: "Optional 'title' is not set. You can add a title used for metadata or internal tracking."
      },
      {
        key: "fromname",
        type: "string",
        missingSeverity: "error",
        messageOnMissing: "Missing 'fromname' in frontmatter. Set fromname: <sender name> for the letter heading."
      },
      {
        key: "fromaddress",
        type: "string|markdown-string",
        missingSeverity: "warning",
        messageOnMissing: "Letter template: 'fromaddress' is not set. Add your address for a complete letterhead."
      },
      {
        key: "toname",
        type: "string",
        missingSeverity: "error",
        messageOnMissing: "Missing 'toname' in frontmatter. Set toname: <recipient name> for the address block."
      },
      {
        key: "toaddress",
        type: "string|markdown-string",
        missingSeverity: "error",
        messageOnMissing: "Missing 'toaddress' in frontmatter. Add the recipient's postal address."
      },
      {
        key: "subject",
        type: "string",
        missingSeverity: "warning",
        messageOnMissing: "Letter template: 'subject' is not set. Adding a subject line is recommended for clarity."
      },
      {
        key: "place",
        type: "string",
        missingSeverity: "ignore",
        messageOnMissing: "Optional 'place' is not set. Set place: <city> if you want it in the date line."
      },
      {
        key: "date",
        type: "date-string",
        missingSeverity: "ignore",
        messageOnMissing: "Optional 'date' is not set. The template will default to today's date if omitted."
      },
      {
        key: "opening",
        type: "string|markdown-string",
        missingSeverity: "warning",
        messageOnMissing: "Letter template: 'opening' is not set. Add a greeting such as 'Dear ...', or it will default to a generic opening."
      },
      {
        key: "closing",
        type: "string|markdown-string",
        missingSeverity: "warning",
        messageOnMissing: "Letter template: 'closing' is not set. Add a closing such as 'Kind regards', or it will default to a generic closing."
      },
      {
        key: "signature",
        type: "string|markdown-string",
        missingSeverity: "ignore",
        messageOnMissing: "Optional 'signature' is not set. You can add a name and title for the signature block."
      },
      {
        key: "client",
        type: "string",
        missingSeverity: "ignore",
        messageOnMissing: "Optional 'client' is not set. Set it only when you need a client-specific LaTeX preamble."
      }
    ]
  },
  // Memo (A4) template – templates/memo/template.tex
  memo: {
    templateId: "memo",
    label: "Memo (A4)",
    fields: [
      {
        key: "title",
        type: "string",
        missingSeverity: "warning",
        messageOnMissing: "Optional 'title' is not set. You can add a title used for metadata or internal tracking."
      },
      {
        key: "memoto",
        type: "string|markdown-string",
        missingSeverity: "error",
        messageOnMissing: "Missing 'memoto' in frontmatter. Set memoto: <recipient(s)> for the memo header."
      },
      {
        key: "memofrom",
        type: "string|markdown-string",
        missingSeverity: "error",
        messageOnMissing: "Missing 'memofrom' in frontmatter. Set memofrom: <author or department> for the memo header."
      },
      {
        key: "subject",
        type: "string",
        missingSeverity: "error",
        messageOnMissing: "Missing 'subject' in frontmatter. Add a subject to describe the memo."
      },
      {
        key: "date",
        type: "date-string",
        missingSeverity: "ignore",
        messageOnMissing: "Optional 'date' is not set. The template will default to today's date if omitted."
      },
      {
        key: "cc",
        type: "string|markdown-string",
        missingSeverity: "ignore",
        messageOnMissing: "Optional 'cc' is not set. You can list additional recipients if desired."
      },
      {
        key: "client",
        type: "string",
        missingSeverity: "ignore",
        messageOnMissing: "Optional 'client' is not set. Set it only when you need a client-specific LaTeX preamble."
      }
    ]
  },
  // IEEE proposal template – templates/ieee-proposal/template.tex
  "ieee-proposal": {
    templateId: "ieee-proposal",
    label: "IEEE Proposal (conference)",
    fields: [
      {
        key: "title",
        type: "string",
        missingSeverity: "error",
        messageOnMissing: "IEEE proposal template: 'title' is required to identify the proposal."
      },
      {
        key: "author",
        type: "string|string[]",
        missingSeverity: "error",
        messageOnMissing: "IEEE proposal template: 'author' is required. Add author: <name> or a list of author names."
      },
      {
        key: "abstract",
        type: "markdown-string",
        missingSeverity: "warning",
        messageOnMissing: "IEEE proposal template: 'abstract' is not set. Add an 'abstract' field to summarise the proposal."
      },
      {
        key: "keywords",
        type: "string|string[]",
        missingSeverity: "ignore",
        messageOnMissing: "Optional 'keywords' are not set. Add keywords: [ ... ] if you want an IEEE keywords section."
      },
      {
        key: "client",
        type: "string",
        missingSeverity: "ignore",
        messageOnMissing: "Optional 'client' is not set. Set it only when you need a client-specific LaTeX preamble."
      }
    ]
  },
  // Business plan template – templates/business-plan/template.tex
  "business-plan": {
    templateId: "business-plan",
    label: "Business Plan (A4 report)",
    fields: [
      {
        key: "title",
        type: "string",
        missingSeverity: "error",
        messageOnMissing: "Business plan template: 'title' is required to identify the plan."
      },
      {
        key: "company",
        type: "string",
        missingSeverity: "warning",
        messageOnMissing: "Business plan template: 'company' is not set. Add company: <name> for the title page."
      },
      {
        key: "author",
        type: "string|string[]",
        missingSeverity: "warning",
        messageOnMissing: "Business plan template: 'author' is not set. Add author: <name> or a list of authors."
      },
      {
        key: "version",
        type: "string",
        missingSeverity: "ignore",
        messageOnMissing: "Optional 'version' is not set. You can add version: <string> to track iterations of the plan."
      },
      {
        key: "executive_summary",
        type: "markdown-string",
        missingSeverity: "warning",
        messageOnMissing: "Business plan template: 'executive_summary' is not set. Add an executive summary to highlight key points."
      },
      {
        key: "date",
        type: "date-string",
        missingSeverity: "ignore",
        messageOnMissing: "Optional 'date' is not set. The template will default to today's date if omitted."
      },
      {
        key: "client",
        type: "string",
        missingSeverity: "ignore",
        messageOnMissing: "Optional 'client' is not set. Set it only when you need a client-specific LaTeX preamble."
      }
    ]
  },
  // General KOMA-Script proposal template – templates/koma-proposal/template.tex
  "koma-proposal": {
    templateId: "koma-proposal",
    label: "Proposal (KOMA-Script, A4)",
    fields: [
      {
        key: "title",
        type: "string",
        missingSeverity: "error",
        messageOnMissing: "Proposal template: 'title' is required to identify the proposal."
      },
      {
        key: "client",
        type: "string",
        missingSeverity: "error",
        messageOnMissing: "Proposal template: 'client' is required so the header can show the client name."
      },
      {
        key: "project",
        type: "string",
        missingSeverity: "warning",
        messageOnMissing: "Proposal template: 'project' is not set. Add project: <name> to describe the engagement."
      },
      {
        key: "proposal_id",
        type: "string",
        missingSeverity: "ignore",
        messageOnMissing: "Optional 'proposal_id' is not set. You can add an internal identifier if desired."
      },
      {
        key: "author",
        type: "string|string[]",
        missingSeverity: "warning",
        messageOnMissing: "Proposal template: 'author' is not set. Add author: <name> or a list of authors."
      },
      {
        key: "date",
        type: "date-string",
        missingSeverity: "ignore",
        messageOnMissing: "Optional 'date' is not set. The template will default to today's date if omitted."
      }
    ]
  }
};
function getFrontmatterSchemaForTemplateId(templateId) {
  return SCHEMA_BY_TEMPLATE_ID[templateId];
}

// src/validation/validator.ts
async function validateFileForTemplate(app, file, template) {
  const cache = app.metadataCache.getFileCache(file);
  const frontmatter = cache?.frontmatter;
  const issues = [];
  if (!frontmatter) {
    issues.push({
      level: "error",
      message: "No YAML frontmatter found. Add a frontmatter block at the top of the note using '---' lines."
    });
    return { isValid: false, issues };
  }
  const get = (key) => frontmatter[key];
  const schema = getFrontmatterSchemaForTemplateId(template.id);
  if (schema) {
    for (const field of schema.fields) {
      let value = get(field.key);
      if (field.key === "title" && (value === void 0 || value === null || typeof value === "string" && value.trim() === "")) {
        const fallbackTitle = file.basename;
        if (fallbackTitle && fallbackTitle.trim() !== "") {
          value = fallbackTitle;
        }
      }
      const isMissing = value === void 0 || value === null || typeof value === "string" && value.trim() === "" || Array.isArray(value) && value.length === 0;
      if (!isMissing) {
        continue;
      }
      if (field.missingSeverity === "ignore") {
        continue;
      }
      issues.push({
        level: field.missingSeverity,
        message: field.messageOnMissing
      });
    }
  } else {
    if (!get("title")) {
      issues.push({
        level: "error",
        message: "Missing 'title' in frontmatter."
      });
    }
    if (!get("author")) {
      issues.push({
        level: "warning",
        message: "Missing 'author' in frontmatter. It is recommended to set an author for academic documents."
      });
    }
  }
  if (Object.prototype.hasOwnProperty.call(frontmatter, "client")) {
    const client = get("client");
    if (!client || typeof client === "string" && client.trim() === "") {
      issues.push({
        level: "warning",
        message: "'client' is defined but empty. Either remove it or set a non-empty identifier (e.g. 'acme')."
      });
    }
  }
  const hasError = issues.some((i) => i.level === "error");
  return { isValid: !hasError, issues };
}

// src/validation/environment.ts
var import_fs = require("fs");
var path3 = __toESM(require("path"));
function validateEnvironmentForTemplate(app, file, template, settings) {
  const issues = [];
  if (settings.exportBackend === "direct") {
    if (template.pandocTemplateRelativePath) {
      const pluginTemplateBase = "/Users/anton/Development/989646093931/obsidian-latex-pdf";
      const templatePath = path3.join(pluginTemplateBase, template.pandocTemplateRelativePath);
      const exists = (0, import_fs.existsSync)(templatePath);
      if (!exists) {
        issues.push({
          level: "error",
          message: `LaTeX template file '${template.pandocTemplateRelativePath}' could not be found relative to the configured template base directory. Check that it is available on disk or adjust the template base path.`
        });
      }
    } else {
      issues.push({
        level: "error",
        message: `Template '${template.id}' does not define a pandoc template path, but the direct backend is selected.`
      });
    }
  }
  if (settings.exportBackend === "direct") {
    if (!settings.pandocPath || settings.pandocPath.trim() === "") {
      issues.push({
        level: "error",
        message: "Direct backend: pandoc executable path is empty. Set a valid 'Pandoc executable path' in the Obsidian LaTeX PDF settings."
      });
    }
    if (settings.pdfEngineBinary && settings.pdfEngineBinary.trim() === "") {
      issues.push({
        level: "warning",
        message: "PDF engine binary is configured but empty. Either clear it or set a valid full path to the LaTeX engine."
      });
    }
  }
  if (settings.enableLatexProfiles && settings.latexProfileBaseDir) {
    const cache = app.metadataCache.getFileCache(file);
    const fm = cache?.frontmatter;
    const rawProfile = fm?.["latex_pdf_profile"];
    if (typeof rawProfile === "string" && rawProfile.trim().length > 0) {
      const profileId = rawProfile.trim();
      const baseDir = settings.latexProfileBaseDir;
      const vaultBasePath = app.vault.adapter?.basePath;
      let baseAbs;
      if (path3.isAbsolute(baseDir) || /^[A-Za-z]:[\\/]/.test(baseDir)) {
        baseAbs = baseDir;
      } else if (vaultBasePath) {
        baseAbs = path3.join(vaultBasePath, baseDir);
      }
      if (baseAbs) {
        const candidate = path3.join(baseAbs, profileId, "preamble.tex");
        if (!(0, import_fs.existsSync)(candidate)) {
          issues.push({
            level: "warning",
            message: `LaTeX profile '${profileId}' is set in frontmatter, but no preamble.tex was found in '${baseDir}/${profileId}'. The profile will be ignored for this export.`
          });
        }
      }
    }
  }
  return issues;
}

// src/main.ts
var DEFAULT_SETTINGS = {
  pandocPath: "pandoc",
  pdfEngine: "xelatex",
  pdfEngineBinary: "",
  defaultType: "kaobook",
  exportBackend: "pandoc-plugin",
  pandocCommandId: "",
  enableLatexProfiles: false,
  latexProfileBaseDir: "",
  serviceBaseUrl: "",
  serviceJwtToken: ""
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
      initialTemplateId: this.settings.defaultType,
      onSelect: (template) => {
        this.openPrintModal(file, template.id);
      }
    });
    modal.open();
  }
  async exportWithDefaultTemplate(file) {
    const template = getTemplateById(this.settings.defaultType);
    if (!template) {
      new import_obsidian4.Notice(
        `Default template '${this.settings.defaultType}' is not available. Please update the plugin settings.`
      );
      return;
    }
    this.openPrintModal(file, template.id);
  }
  async openPrintModal(file, templateId) {
    const template = getTemplateById(templateId);
    if (!template) {
      new import_obsidian4.Notice(`Template '${templateId}' is not available.`);
      return;
    }
    const validation = await validateFileForTemplate(this.app, file, template);
    const envIssues = validateEnvironmentForTemplate(this.app, file, template, {
      exportBackend: this.settings.exportBackend,
      pandocPath: this.settings.pandocPath,
      pdfEngineBinary: this.settings.pdfEngineBinary,
      enableLatexProfiles: this.settings.enableLatexProfiles,
      latexProfileBaseDir: this.settings.latexProfileBaseDir
    });
    if (envIssues.length) {
      validation.issues.push(...envIssues);
      if (envIssues.some((i) => i.level === "error")) {
        validation.isValid = false;
      }
    }
    const modal = new PrintModal(this.app, {
      file,
      template,
      validation,
      onExport: async () => {
        if (validation && !validation.isValid) {
          new import_obsidian4.Notice(
            "Cannot export to LaTeX PDF: fix validation errors in the frontmatter first."
          );
          return;
        }
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
        } else if (this.settings.exportBackend === "service") {
          await exportNoteViaService(this.app, file, template, {
            baseUrl: this.settings.serviceBaseUrl || "",
            jwtToken: this.settings.serviceJwtToken || ""
          });
        } else {
          await exportNoteToPdf(this.app, file, template, {
            pandocPath: this.settings.pandocPath,
            pdfEngine: this.settings.pdfEngine,
            pdfEngineBinary: this.settings.pdfEngineBinary
          });
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
  get useLatexProfiles() {
    return !!this.plugin.settings.enableLatexProfiles;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Obsidian LaTeX PDF Settings" });
    new import_obsidian4.Setting(containerEl).setName("Export backend").setDesc(
      "Choose whether to call pandoc directly, use the Pandoc plugin, or send notes to a remote HTTP service."
    ).addDropdown((dropdown) => {
      dropdown.addOption("pandoc-plugin", "Use Pandoc plugin (recommended)");
      dropdown.addOption("direct", "Direct pandoc (experimental)");
      dropdown.addOption("service", "Remote HTTP service");
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
    new import_obsidian4.Setting(containerEl).setName("LaTeX profile preambles").setDesc(
      "When enabled, notes with a 'latex_pdf_profile' frontmatter field will include a matching preamble from the configured directory."
    ).addToggle((toggle) => {
      toggle.setValue(this.useLatexProfiles).onChange(async (value) => {
        this.plugin.settings.enableLatexProfiles = value;
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian4.Setting(containerEl).setName("LaTeX profile base directory").setDesc(
      "Directory containing per-profile preambles (each in '<profile>/preamble.tex'). Can be absolute or relative to your vault root."
    ).addText(
      (text) => text.setPlaceholder("latex-preambles").setValue(this.plugin.settings.latexProfileBaseDir || "").onChange(async (value) => {
        this.plugin.settings.latexProfileBaseDir = value.trim();
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
    new import_obsidian4.Setting(containerEl).setName("PDF engine binary (advanced)").setDesc(
      "Optional full path to the LaTeX engine binary used by pandoc (e.g. /Library/TeX/texbin/xelatex). Leave empty to use the engine selected above."
    ).addText(
      (text) => text.setPlaceholder("/Library/TeX/texbin/xelatex").setValue(this.plugin.settings.pdfEngineBinary || "").onChange(async (value) => {
        this.plugin.settings.pdfEngineBinary = value.trim();
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian4.Setting(containerEl).setName("Remote service base URL").setDesc("Base URL of the HTTP rendering service (e.g. https://pdf.example.com).").addText(
      (text) => text.setPlaceholder("https://pdf.example.com").setValue(this.plugin.settings.serviceBaseUrl || "").onChange(async (value) => {
        this.plugin.settings.serviceBaseUrl = value.trim();
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian4.Setting(containerEl).setName("Remote service JWT token").setDesc(
      "Optional JWT token sent as 'Authorization: Bearer <token>' to authenticate with the remote service."
    ).addText(
      (text) => text.setPlaceholder("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...").setValue(this.plugin.settings.serviceJwtToken || "").onChange(async (value) => {
        this.plugin.settings.serviceJwtToken = value.trim();
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian4.Setting(containerEl).setName("Default template").setDesc("Template used when exporting without choosing.").addDropdown((dropdown) => {
      const templates = getAvailableTemplates();
      for (const tpl of templates) {
        dropdown.addOption(tpl.id, tpl.label);
      }
      const current = this.plugin.settings.defaultType;
      if (templates.some((t) => t.id === current)) {
        dropdown.setValue(current);
      } else if (templates.length > 0) {
        dropdown.setValue(templates[0].id);
      }
      dropdown.onChange(async (value) => {
        this.plugin.settings.defaultType = value;
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
