// File: src/validation/environment.ts
// Purpose: Environment-level checks to reduce the likelihood of failed exports.
// These checks validate that the LaTeX template file exists and that basic
// backend configuration (pandoc path, etc.) looks sane.

import { existsSync } from "fs";
import * as path from "path";
import type { TemplateDefinition } from "../templateRegistry";

export type EnvironmentIssueLevel = "error" | "warning";

export interface EnvironmentIssue {
  level: EnvironmentIssueLevel;
  message: string;
}

export interface EnvironmentSettingsLike {
  exportBackend: "direct" | "pandoc-plugin";
  pandocPath: string;
  pdfEngineBinary: string;
}

/**
 * Perform simple environment checks that apply regardless of frontmatter.
 *
 * These do not guarantee success, but they help catch common misconfigurations
 * such as missing template files or empty pandoc paths in direct mode.
 */
export function validateEnvironmentForTemplate(
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

  return issues;
}