---
title: "Example Book: Obsidian LaTeX PDF"
subtitle: "Demonstrating the kaobook template"
author:
  - "Anton Bakker"
  - "Editorial Board"
date: 2026-01-05
abstract: |
  This example note demonstrates how to structure a book-style document with
  the **Kaobook (book layout, A4)** template. It shows how frontmatter fields
  map to title pages, how the table of contents is generated, and how chapters
  and sections are typically organised.
client: "demo-publisher"
keywords:
  - "obsidian"
  - "pandoc"
  - "latex"
  - "kaobook"
---

# About this book example

The Kaobook template targets longer works such as books, lecture notes, or
extensive manuals. It uses the `kaobook` class to provide a rich book layout
with front matter, table of contents, and main matter.

## Frontmatter fields explained

- `title` (book title) and `subtitle`.
- `author` (list of authors or editors).
- `date` (publication or draft date).
- `abstract` (optional, rendered as a front-matter abstract).
- `client` (optional): if a client-specific preamble is available, it can be
  used to configure publisher branding.

## Structure: front matter, main matter

The Kaobook template:

- Switches to **front matter** for the title page and abstract.
- Automatically inserts a **table of contents**.
- Then switches to **main matter** for the body of the book.

# Part I – Foundations

This top-level heading can be thought of as a high-level part of the book. In
simple documents, you can use it as a chapter; more advanced kaobook setups
might use explicit `\part` commands.

## Chapter 1 – Introduction

This chapter explains the motivation for the book and how to use it.

### Section 1.1 – Audience

Describe who this book is for and what background knowledge is assumed.

### Section 1.2 – How to read this example

Explain that this note is a self-documenting example and a test fixture.

## Chapter 2 – Basic Concepts

Introduce key terms and basic workflows, such as:

- Writing notes in Obsidian.
- Configuring the LaTeX PDF plugin.
- Choosing templates at export time.

# Part II – Advanced Topics

## Chapter 3 – Figures and tables

Demonstrate how figures and tables appear in a book layout.

### Figures

```markdown
![Architecture overview](images/architecture-overview.png){ width=70% }
```

### Tables

| Chapter | Topic                     | Estimate (pages) |
|:--------|:--------------------------|-----------------:|
| 1       | Introduction              |                5 |
| 2       | Basic Concepts            |               20 |
| 3       | Figures and Tables        |               10 |
| 4       | Publishing and Workflows  |               15 |

## Chapter 4 – Publishing workflow

Describe how to:

1. Draft content in Obsidian.
2. Use the LaTeX PDF plugin to export.
3. Review the generated PDF.
4. Iterate based on feedback.

# Appendix A – Additional notes

Appendices can be represented by regular headings as well; the exact mapping to
LaTeX appendix environments depends on the underlying class and configuration.

This example book note is intended as:

- A starting point for real kaobook-based manuscripts.
- A regression test fixture to ensure book-style exports keep working as the
  plugin evolves.
