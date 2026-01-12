// File: tests/validator.test.ts
// Purpose: Tests for the validation engine using mocked Obsidian App/TFile.

import { describe, it, expect } from "vitest";
import type { App, TFile } from "obsidian";
import { validateFileForTemplate } from "../src/validation/validator";
import { getTemplateById } from "../src/templateRegistry";

function makeMockApp(frontmatter: Record<string, unknown> | undefined): App {
  return {
    // We only implement the part of App used by validateFileForTemplate.
    metadataCache: {
      getFileCache(_file: TFile) {
        return frontmatter ? { frontmatter } : undefined;
      },
    },
  } as unknown as App;
}

function makeMockFile(): TFile {
  // The validator only passes the file into metadataCache.getFileCache,
  // so we do not need any real fields here.
  return {} as TFile;
}

describe("validation/validator", () => {
  it("returns an error when frontmatter is missing", async () => {
    const app = makeMockApp(undefined);
    const file = makeMockFile();
    const template = getTemplateById("article");
    if (!template) throw new Error("Expected article template to exist");

    const result = await validateFileForTemplate(app, file, template);
    expect(result.isValid).toBe(false);
    expect(result.issues.some((i) => i.level === "error")).toBe(true);
  });

  it("accepts a minimal valid article frontmatter", async () => {
    const frontmatter = {
      title: "Valid Article",
      author: "Author Name",
    };
    const app = makeMockApp(frontmatter);
    const file = makeMockFile();
    const template = getTemplateById("article");
    if (!template) throw new Error("Expected article template to exist");

    const result = await validateFileForTemplate(app, file, template);
    expect(result.isValid).toBe(true);
    expect(result.issues.length).toBeGreaterThanOrEqual(0);
  });

  it("treats missing thesis university/abstract as blocking errors", async () => {
    const frontmatter = {
      title: "Thesis without university",
      author: "Student Name",
      // Note: intentionally omitting university and abstract to trigger errors.
    };
    const app = makeMockApp(frontmatter);
    const file = makeMockFile();
    const template = getTemplateById("thesis-kaobook");
    if (!template) throw new Error("Expected thesis-kaobook template to exist");

    const result = await validateFileForTemplate(app, file, template);

    expect(result.isValid).toBe(false);
    const messages = result.issues.map((i) => i.message).join(" ");
    expect(messages).toContain("Thesis template");
  });

  it("warns when client is present but empty", async () => {
    const frontmatter = {
      title: "Client test",
      author: "Author Name",
      client: " ",
    };
    const app = makeMockApp(frontmatter);
    const file = makeMockFile();
    const template = getTemplateById("article");
    if (!template) throw new Error("Expected article template to exist");

    const result = await validateFileForTemplate(app, file, template);
    expect(result.isValid).toBe(true);
    expect(result.issues.some((i) => i.message.includes("client"))).toBe(true);
  });
});
