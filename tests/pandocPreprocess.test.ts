// File: tests/pandocPreprocess.test.ts
// Purpose: Tests for the heading injection logic used before running pandoc.

import { describe, it, expect } from "vitest";
import { injectNoteTitleHeadingIfMissing } from "../src/pandocRunner";

describe("pandocRunner/injectNoteTitleHeadingIfMissing", () => {
  it("leaves content unchanged when first heading is already level 1 without frontmatter", () => {
    const content = [
      "# Existing title",
      "",
      "Some body text.",
    ].join("\n");

    const result = injectNoteTitleHeadingIfMissing(content, "Note Title");
    expect(result).toBe(content);
  });

  it("prepends an H1 from note title when first heading is level 2 without frontmatter", () => {
    const content = [
      "## Section",
      "",
      "Body text.",
    ].join("\n");

    const result = injectNoteTitleHeadingIfMissing(content, "My Note");

    expect(result).toBe([
      "# My Note",
      "",
      "## Section",
      "",
      "Body text.",
    ].join("\n"));
  });

  it("inserts an H1 after frontmatter when first heading is level 2 and title already exists", () => {
    const content = [
      "---",
      "title: Something",
      "---",
      "",
      "## Section",
      "",
      "Body text.",
    ].join("\n");

    const result = injectNoteTitleHeadingIfMissing(content, "Frontmatter Note");

    expect(result).toBe([
      "---",
      "title: Something",
      "---",
      "# Frontmatter Note",
      "",
      "## Section",
      "",
      "Body text.",
    ].join("\n"));
  });

  it("injects a title into frontmatter when missing and then adds an H1", () => {
    const content = [
      "---",
      "author: Someone",
      "---",
      "",
      "## Section",
      "",
      "Body text.",
    ].join("\n");

    const result = injectNoteTitleHeadingIfMissing(content, "Auto Title");

    expect(result).toBe([
      "---",
      "title: \"Auto Title\"",
      "author: Someone",
      "---",
      "# Auto Title",
      "",
      "## Section",
      "",
      "Body text.",
    ].join("\n"));
  });

  it("adds an H1 when there are no headings at all", () => {
    const content = [
      "Just some text without headings.",
      "Another line.",
    ].join("\n");

    const result = injectNoteTitleHeadingIfMissing(content, "Headingless Note");

    expect(result).toBe([
      "# Headingless Note",
      "",
      "Just some text without headings.",
      "Another line.",
    ].join("\n"));
  });
});
