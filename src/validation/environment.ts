// File: src/validation/environment.ts
// Purpose: Environment-level checks to reduce the likelihood of failed exports.
// These checks validate that the LaTeX template file exists and that basic
// backend configuration (pandoc path, etc.) looks sane.

import { existsSync } from "fs";
import * as path from "path";
import type { App, TFile } from "obsidian";
import type { TemplateDefinition } from "../templateRegistry";

export type EnvironmentIssueLevel = "error" | "warning";

export interface EnvironmentIssue {
  level: EnvironmentIssueLevel;
  message: string;
}

export interface EnvironmentSettingsLike {
  exportBackend: "direct" | "pandoc-plugin" | "service";
  pandocPath: string;
  pdfEngineBinary: string;
  enableLatexProfiles?: boolean;
  latexProfileBaseDir?: string;
  /** Optional base URL for the remote HTTP rendering service. */
  serviceBaseUrl?: string;
}

/**
 * Perform simple environment checks that apply regardless of frontmatter.
 *
 * These do not guarantee success, but they help catch common misconfigurations
 * such as missing template files or empty pandoc paths in direct mode.
 */
export function validateEnvironmentForTemplate(
  app: App,
  file: TFile,
  template: TemplateDefinition,
  settings: EnvironmentSettingsLike,
): EnvironmentIssue[] {
  const issues: EnvironmentIssue[] = [];

  // 1. Verify that the LaTeX template file exists, but only when using the
  // direct backend. When delegating to the Pandoc plugin, the template path is
  // managed by that plugin instead and we do not enforce a local file here.
  if (settings.exportBackend === "direct") {
    if (template.pandocTemplateRelativePath) {
      // Use the same base directory that runPandocToPdf uses to resolve
      // template paths so that the environment check matches actual runtime
      // behaviour.
      const pluginTemplateBase = "/Users/anton/Development/989646093931/obsidian-latex-pdf";
      const templatePath = path.join(pluginTemplateBase, template.pandocTemplateRelativePath);

      const exists = existsSync(templatePath);
      if (!exists) {
        issues.push({
          level: "error",
          message: `LaTeX template file '${template.pandocTemplateRelativePath}' could not be found relative to the configured template base directory. Check that it is available on disk or adjust the template base path.`,
        });
      }
    } else {
      // Direct backend without a template path is likely misconfigured.
      issues.push({
          level: "error",
          message: `Template '${template.id}' does not define a pandoc template path, but the direct backend is selected.`,
        });
    }
  }

  // 2. Basic sanity checks for the direct backend configuration.
  if (settings.exportBackend === "direct") {
    if (!settings.pandocPath || settings.pandocPath.trim() === "") {
      issues.push({
        level: "error",
        message:
          "Direct backend: pandoc executable path is empty. Set a valid 'Pandoc executable path' in the Obsidian LaTeX PDF settings.",
      });
    }

    // We do not attempt to fully resolve the engine binary here, but we can at
    // least warn when an obviously malformed value is set.
    if (settings.pdfEngineBinary && settings.pdfEngineBinary.trim() === "") {
      issues.push({
        level: "warning",
        message:
          "PDF engine binary is configured but empty. Either clear it or set a valid full path to the LaTeX engine.",
      });
    }
  }

  // 3. Optional LaTeX profile preamble check: warn when a latex_pdf_profile is
  // configured in frontmatter but no matching preamble.tex is found in the
  // configured base directory.
  if (settings.enableLatexProfiles && settings.latexProfileBaseDir) {
    const cache = app.metadataCache.getFileCache(file);
    const fm = cache?.frontmatter as Record<string, unknown> | undefined;
    const rawProfile = fm?.["latex_pdf_profile"];

    if (typeof rawProfile === "string" && rawProfile.trim().length > 0) {
      const profileId = rawProfile.trim();
      const baseDir = settings.latexProfileBaseDir;
      const vaultBasePath = (app.vault as any).adapter?.basePath as string | undefined;

      let baseAbs: string | undefined;
      if (path.isAbsolute(baseDir) || /^[A-Za-z]:[\\/]/.test(baseDir)) {
        baseAbs = baseDir;
      } else if (vaultBasePath) {
        baseAbs = path.join(vaultBasePath, baseDir);
      }

      if (baseAbs) {
        const candidate = path.join(baseAbs, profileId, "preamble.tex");
        if (!existsSync(candidate)) {
          issues.push({
            level: "warning",
            message:
              `LaTeX profile '${profileId}' is set in frontmatter, but no preamble.tex was found in '${baseDir}/${profileId}'. The profile will be ignored for this export.`,
          });
        }
      }
    }
  }

  // 4. Remote HTTP service backend sanity checks.
  if (settings.exportBackend === "service") {
    const rawUrl = (settings.serviceBaseUrl ?? "").trim();

    if (!rawUrl) {
      issues.push({
        level: "error",
        message:
          "Remote backend: 'Remote service base URL' is empty. Set a valid base URL (for example, https://latex.example.com) in the Obsidian LaTeX PDF settings or switch to a different backend.",
      });
    } else {
      try {
        const parsed = new URL(rawUrl);
        const hostname = parsed.hostname;

        const looksLikeIp = /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname);
        const isLocalhost = hostname === "localhost";
        const hasDot = hostname.includes(".");

        if (!looksLikeIp && !isLocalhost && !hasDot) {
          issues.push({
            level: "warning",
            message:
              `Remote backend: service host '${hostname}' does not look like a fully qualified domain name. Ensure DNS is configured for this host or use the raw load balancer DNS name from your CloudFormation stack.`,
          });
        }
      } catch {
        issues.push({
          level: "error",
          message:
            "Remote backend: 'Remote service base URL' is not a valid URL. Use a value like https://latex.example.com or https://your-alb-dns-name.",
        });
      }
    }
  }

  return issues;
}
