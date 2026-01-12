// File: src/validation/frontmatterSchema.ts
// Purpose: Central configuration for required frontmatter fields per template,
//          including their type and severity when missing. This file is the
//          single source of truth for validation rules used by the plugin.

/**
 * Supported logical types for frontmatter fields.
 *
 * These are semantic types used only for documentation and potential
 * future type-checking. The validator currently focuses on presence and
 * emptiness checks using the configured severities.
 */
export type FrontmatterFieldType =
  | "string"
  | "string[]"
  | "string|string[]"
  | "date-string"
  | "markdown-string";

/**
 * Severity to apply when a field is missing or effectively empty.
 *
 * - "error": Block export until fixed.
 * - "warning": Allow export but highlight the missing field.
 * - "ignore": Do not create a validation issue for missing field.
 */
export type MissingSeverity = "error" | "warning" | "ignore";

/**
 * Configuration for a single frontmatter field for a given template.
 */
export interface TemplateFieldDefinition {
  /** YAML key, e.g. "title" or "university". */
  key: string;
  /** Semantic type for documentation and potential future validation. */
  type: FrontmatterFieldType;
  /** Severity used when the field is missing or empty. */
  missingSeverity: MissingSeverity;
  /**
   * Human-readable message shown when the field is missing or empty.
   * Should explain what the user needs to add or change.
   */
  messageOnMissing: string;
}

/**
 * Frontmatter schema for a specific LaTeX/Pandoc template.
 */
export interface TemplateFrontmatterSchema {
  /** Template identifier, matching TemplateDefinition.id. */
  templateId: string;
  /** Human-readable label for documentation purposes. */
  label: string;
  /** Field-level configuration for this template. */
  fields: TemplateFieldDefinition[];
}

/**
 * Internal map from template ID to its configured frontmatter schema.
 *
 * NOTE: When adding or changing templates, update this configuration so that
 * validation and documentation stay in sync.
 */
const SCHEMA_BY_TEMPLATE_ID: Record<string, TemplateFrontmatterSchema> = {
  // Article (A4) template – templates/article/template.tex
  article: {
    templateId: "article",
    label: "Article (A4)",
    fields: [
      {
        key: "title",
        type: "string",
        missingSeverity: "error",
        messageOnMissing:
          "Missing 'title' in frontmatter. Add a title: <string> to identify the article.",
      },
      {
        key: "author",
        type: "string|string[]",
        missingSeverity: "warning",
        messageOnMissing:
          "Missing 'author' in frontmatter. It is recommended to set an author for academic or formal documents.",
      },
      {
        key: "date",
        type: "date-string",
        missingSeverity: "ignore",
        messageOnMissing:
          "Optional 'date' is not set. The template will default to today's date if omitted.",
      },
      {
        key: "abstract",
        type: "markdown-string",
        missingSeverity: "ignore",
        messageOnMissing:
          "Optional 'abstract' is not set. You can add a short summary using an 'abstract' field.",
      },
      {
        key: "client",
        type: "string",
        missingSeverity: "ignore",
        messageOnMissing:
          "Optional 'client' is not set. Set it only when you need a client-specific LaTeX preamble.",
      },
    ],
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
        messageOnMissing:
          "Missing 'title' in frontmatter. Add a title: <string> to identify the report.",
      },
      {
        key: "author",
        type: "string|string[]",
        missingSeverity: "warning",
        messageOnMissing:
          "Missing 'author' in frontmatter. It is recommended to list report authors.",
      },
      {
        key: "date",
        type: "date-string",
        missingSeverity: "ignore",
        messageOnMissing:
          "Optional 'date' is not set. The template will default to today's date if omitted.",
      },
      {
        key: "abstract",
        type: "markdown-string",
        missingSeverity: "warning",
        messageOnMissing:
          "Report template: 'abstract' is not set. Add an 'abstract' field to provide a short summary.",
      },
      {
        key: "client",
        type: "string",
        missingSeverity: "ignore",
        messageOnMissing:
          "Optional 'client' is not set. Set it only when you need a client-specific LaTeX preamble.",
      },
      // Fields like subtitle/keywords are documented in examples but currently
      // not enforced by validation.
    ],
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
        messageOnMissing:
          "Missing 'title' in frontmatter. Add a title: <string> to identify the book.",
      },
      {
        key: "subtitle",
        type: "string",
        missingSeverity: "ignore",
        messageOnMissing:
          "Optional 'subtitle' is not set. You can add a 'subtitle' to appear under the main title.",
      },
      {
        key: "author",
        type: "string|string[]",
        missingSeverity: "warning",
        messageOnMissing:
          "Missing 'author' in frontmatter. It is recommended to list book authors.",
      },
      {
        key: "date",
        type: "date-string",
        missingSeverity: "ignore",
        messageOnMissing:
          "Optional 'date' is not set. The template will default to today's date if omitted.",
      },
      {
        key: "abstract",
        type: "markdown-string",
        missingSeverity: "warning",
        messageOnMissing:
          "Book template: 'abstract' is not set. Add an 'abstract' field to summarise the work.",
      },
      {
        key: "client",
        type: "string",
        missingSeverity: "ignore",
        messageOnMissing:
          "Optional 'client' is not set. Set it only when you need a client-specific LaTeX preamble.",
      },
    ],
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
        messageOnMissing:
          "Missing 'title' in frontmatter. A thesis must have a clear title.",
      },
      {
        key: "author",
        type: "string|string[]",
        missingSeverity: "error",
        messageOnMissing:
          "Missing 'author' in frontmatter. A thesis must declare its author.",
      },
      {
        key: "university",
        type: "string",
        missingSeverity: "error",
        messageOnMissing:
          "Thesis template: 'university' is not set in frontmatter. Add university: <name> to identify the institution.",
      },
      {
        key: "subtitle",
        type: "string",
        missingSeverity: "ignore",
        messageOnMissing:
          "Optional 'subtitle' is not set. You can add a 'subtitle' for additional context.",
      },
      {
        key: "date",
        type: "date-string",
        missingSeverity: "ignore",
        messageOnMissing:
          "Optional 'date' is not set. The template will default to today's date if omitted.",
      },
      {
        key: "abstract",
        type: "markdown-string",
        missingSeverity: "error",
        messageOnMissing:
          "Thesis template: 'abstract' is not set. Add an 'abstract' field in frontmatter to provide a summary.",
      },
      {
        key: "acknowledgements",
        type: "markdown-string",
        missingSeverity: "ignore",
        messageOnMissing:
          "Optional 'acknowledgements' is not set. You can add acknowledgements if desired.",
      },
      {
        key: "client",
        type: "string",
        missingSeverity: "ignore",
        messageOnMissing:
          "Optional 'client' is not set. Set it only when you need a client-specific LaTeX preamble.",
      },
    ],
  },
};

/**
 * Look up the frontmatter schema for a given template ID.
 */
export function getFrontmatterSchemaForTemplateId(
  templateId: string,
): TemplateFrontmatterSchema | undefined {
  return SCHEMA_BY_TEMPLATE_ID[templateId];
}