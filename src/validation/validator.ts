import type { App, TFile } from "obsidian";
import type { TemplateDefinition } from "../templateRegistry";

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

  // Helper to read simple keys
  const get = (key: string) => frontmatter[key];

  // Basic checks for all templates
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

  // Template-specific checks
  if (template.kind === "thesis") {
    if (!get("university")) {
      issues.push({
        level: "warning",
        message:
          "Thesis template: 'university' is not set in frontmatter. Consider adding university: <name>.",
      });
    }
    if (!get("abstract")) {
      issues.push({
        level: "warning",
        message:
          "Thesis template: 'abstract' is not set. Add an 'abstract' field in frontmatter or a dedicated Abstract section.",
      });
    }
  }

  // Client metadata is optional but we can flag empty values
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