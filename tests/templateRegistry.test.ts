// File: tests/templateRegistry.test.ts
// Purpose: Basic tests for the template registry used by the plugin.

import { describe, it, expect } from "vitest";
import { getAvailableTemplates, getTemplateById } from "../src/templateRegistry";

describe("templateRegistry", () => {
  it("exposes all expected templates", () => {
    const templates = getAvailableTemplates();
    const ids = templates.map((t) => t.id).sort();

    expect(ids).toEqual([
      "article",
      "kaobook",
      "report",
      "thesis-kaobook",
    ]);
  });

  it("returns template details by id", () => {
    const article = getTemplateById("article");
    expect(article).toBeDefined();
    expect(article?.label).toContain("Article");
    expect(article?.pandocTemplateRelativePath).toBe("templates/article/template.tex");
  });

  it("returns undefined for unknown ids", () => {
    const unknown = getTemplateById("non-existent-template-id");
    expect(unknown).toBeUndefined();
  });
});
