// File: src/validation/validator.ts
// Purpose: Validate a note's frontmatter against the configured schema for the
//          selected LaTeX/Pandoc template. The configuration for each template
//          (required fields, types, and severities) lives in frontmatterSchema.

import type { App, TFile } from "obsidian";
import type { TemplateDefinition } from "../templateRegistry";
import { getFrontmatterSchemaForTemplateId } from "./frontmatterSchema";

export type ValidationLevel = "error" | "warning";

export interface ValidationIssue {
  level: ValidationLevel;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
}

export async function validateFileForTemplate(
  app: App,
  file: TFile,
  template: TemplateDefinition,
): Promise<ValidationResult> {
  const cache = app.metadataCache.getFileCache(file);
  const frontmatter: Record<string, unknown> | undefined = cache?.frontmatter;

  const issues: ValidationIssue[] = [];

  if (!frontmatter) {
    issues.push({
      level: "error",
      message:
        "No YAML frontmatter found. Add a frontmatter block at the top of the note using '---' lines.",
    });
    return { isValid: false, issues };
  }

  const get = (key: string) => frontmatter[key];

  // Look up the schema for this template and apply configured field rules.
  const schema = getFrontmatterSchemaForTemplateId(template.id);
  if (schema) {
    for (const field of schema.fields) {
      let value = get(field.key);

      // For 'title', treat the note's basename as an implicit fallback. The
      // preprocessor will inject this into frontmatter before pandoc runs,
      // so validation should not block export solely because the explicit
      // YAML 'title' field is missing.
      if (
        field.key === "title" &&
        (value === undefined ||
          value === null ||
          (typeof value === "string" && value.trim() === ""))
      ) {
        const fallbackTitle = file.basename;
        if (fallbackTitle && fallbackTitle.trim() !== "") {
          value = fallbackTitle;
        }
      }

      const isMissing =
        value === undefined ||
        value === null ||
        (typeof value === "string" && value.trim() === "") ||
        (Array.isArray(value) && value.length === 0);

      if (!isMissing) {
        continue;
      }

      if (field.missingSeverity === "ignore") {
        continue;
      }

      issues.push({
        level: field.missingSeverity,
        message: field.messageOnMissing,
      });
    }
  } else {
    // Fallback behaviour when no schema is configured for a template.
    if (!get("title")) {
      issues.push({
        level: "error",
        message: "Missing 'title' in frontmatter.",
      });
    }
    if (!get("author")) {
      issues.push({
        level: "warning",
        message:
          "Missing 'author' in frontmatter. It is recommended to set an author for academic documents.",
      });
    }
  }

  // Client metadata is optional but we can flag empty values regardless of template.
  if (Object.prototype.hasOwnProperty.call(frontmatter, "client")) {
    const client = get("client");
    if (!client || (typeof client === "string" && client.trim() === "")) {
      issues.push({
        level: "warning",
        message:
          "'client' is defined but empty. Either remove it or set a non-empty identifier (e.g. 'acme').",
      });
    }
  }

  const hasError = issues.some((i) => i.level === "error");
  return { isValid: !hasError, issues };
}
