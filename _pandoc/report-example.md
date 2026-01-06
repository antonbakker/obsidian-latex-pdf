---
title: "Example Report: Obsidian LaTeX PDF"
subtitle: "Demonstrating the report (scrreprt) template"
author:
  - "Anton Bakker"
  - "Project Team"
date: 2026-01-05
abstract: |
  This example note demonstrates how to structure a multi-chapter technical
  report using the **Report (A4)** template. It highlights how chapters map to
  markdown headings, and how optional fields like `client` and `keywords` can
  be used.
client: "internal-demo"
keywords:
  - "obsidian"
  - "pandoc"
  - "latex"
  - "report"
---

# About this report example

The report template is based on the `scrreprt` class (KOMA-Script). It is
suitable for longer documents that need chapters, such as technical reports or
project documentation.

## Frontmatter fields explained

The fields are similar to the article example:

- `title` (used for the report title page).
- `subtitle` (optional, may appear under the main title depending on the class).
- `author` (one or more authors).
- `date` (optional, defaults to `\today`).
- `abstract` (optional, rendered as an abstract section before the main body).
- `client` (optional, used to include a client-specific LaTeX preamble if
  available).
- `keywords` (optional, reserved for future use or custom styles).

## Chapters vs sections

In a report, top-level headings are typically interpreted as **chapters**, not
sections. You can still use deeper heading levels for sections inside chapters.

# Chapter 1 – Overview

This top-level heading becomes `\chapter{Chapter 1 – Overview}`.

## Background

This is a section within Chapter 1. It becomes `\section{Background}`.

### Scope

This is a subsection, mapped to `\subsection{Scope}`.

# Chapter 2 – Requirements

This chapter demonstrates lists and tables.

## Functional requirements

- The plugin MUST support exporting markdown notes to PDF using Pandoc.
- The plugin SHOULD support multiple LaTeX templates.
- The plugin SHOULD validate the note before export and show human-readable
  messages.

## Non-functional requirements

1. Exports SHOULD complete within a reasonable time on typical hardware.
2. The configuration SHOULD be stored in Obsidian's plugin data storage.
3. Templates SHOULD be easy to extend or customise.

## Example table

| ID  | Requirement                           | Priority |
|:----|:--------------------------------------|:---------|
| FR1 | Export markdown notes to PDF          | Must     |
| FR2 | Support multiple LaTeX templates      | Should   |
| NFR1| Provide understandable error messages | Should   |

# Chapter 3 – Client-specific behaviour

This chapter exists to exercise the `client` field in the frontmatter.

If you configure a LaTeX file at `clients/internal-demo/preamble.tex`, the
report template will attempt to include it when the `client` field is set to
`internal-demo`.

Typical customisations in such a preamble might include:

- Company logo on the title page.
- Corporate fonts and colours.
- Custom headers and footers.

# Chapter 4 – Summary

This example demonstrates:

- How chapters and sections map from markdown headings to LaTeX structures.
- How to use frontmatter to control title, abstract, and optional client
  configuration.
- A structure that can be re-used as a starting point for real reports and as a
  fixture for automated tests.
