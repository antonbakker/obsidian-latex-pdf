---
title: "Example Article: Obsidian LaTeX PDF"
subtitle: "Demonstrating the article (scrartcl) template"
author:
  - "Anton Bakker"
  - "Co-author Example"
date: 2026-01-05
abstract: |
  This example note demonstrates how to structure a markdown document for the
  **Article (A4)** template. It shows which frontmatter fields are used, how
  to include a client identifier, and which markdown features map cleanly to
  LaTeX constructs (sections, equations, tables, figures).
client: "demo-client"
keywords:
  - "obsidian"
  - "pandoc"
  - "latex"
  - "article"
---

# About this example

This note is intended as both:

- **User documentation**: you can duplicate it in your vault and adapt it.
- **Test fixture**: the plugin's validation logic can read this file and
  verify that all required fields are present.

The **Article (A4)** template is based on the `scrartcl` class from KOMA-Script
and is suitable for shorter papers and reports.

## Frontmatter fields explained

- `title` (required by the validation engine): used as the document title.
- `subtitle` (optional): shown below the title if the LaTeX template supports it.
- `author` (recommended): one or more authors; the template will join them with line breaks.
- `date` (optional): if omitted, the LaTeX template defaults to `\today`.
- `abstract` (optional but recommended): rendered in an `abstract` environment.
- `client` (optional):
  - Used to select a client-specific LaTeX preamble if `clients/<client>/preamble.tex` exists.
  - If present but empty, the validator issues a warning.
- `keywords` (optional): can be used later for custom templates or indexing.

## Sections and structure

Use standard markdown headings to create sections. These are translated into
LaTeX `\section`, `\subsection`, etc.

### Introduction

This is a sample introduction section. It demonstrates basic paragraph text,
inline *emphasis* and **strong emphasis**, and `inline code` examples.

### Lists and tight lists

Pandoc sometimes generates a `\\tightlist` macro for compact lists. The article
LaTeX template defines this macro so your exports compile without additional
configuration.

- First bullet in a regular list.
- Second bullet.
- Third bullet.

1. First numbered item
2. Second numbered item
3. Third numbered item

## Mathematics

Inline math is written as `$E = mc^2$`. Display math uses a standard LaTeX block, for example:

$$
  f(x) = \int_{-\infty}^{\infty} e^{-x^2} \, dx
$$

In markdown, you can simply write the following lines (shown here as inline code so they render literally):

- `Let $E = mc^2$ be the famous equation.`
- `$$  f(x) = \int_{-\infty}^{\infty} e^{-x^2} \, dx $$`

The template loads `amsmath` and `amssymb`, so standard AMS environments and
symbols are available.

## Tables

Simple tables can be written in GitHub-style markdown and are converted to
LaTeX `longtable` + `booktabs` by Pandoc.

| Parameter | Description                | Example |
|----------:|----------------------------|---------|
| alpha     | learning rate              | 0.01    |
| beta      | momentum term              | 0.9     |
| epochs    | number of training epochs | 50      |

## Figures

To include an image, place it in your vault and reference it by relative path:

```markdown
![Demo figure](images/demo-figure.png){ width=60% }
```

The article template loads `graphicx`, so standard `\includegraphics` options
work. The `{ width=60% }` attribute is interpreted by Pandoc and translated to
LaTeX.

## Client-specific configuration

The article template contains the following logic (simplified):

```latex
$if(client)$
  \IfFileExists{clients/$client$/preamble.tex}{\input{clients/$client$/preamble.tex}}{}
$endif$
```

If you set `client: "demo-client"` in the frontmatter and create a file
`clients/demo-client/preamble.tex` in your LaTeX environment, that file can
override fonts, colors, and other styling for that client.

For testing purposes, this note exercises the `client` frontmatter field so the
validator can confirm that a non-empty client value is accepted.

## Conclusion

This example demonstrates a typical short article with:

- Required and optional frontmatter fields.
- Section structure.
- Math, tables, and figures.
- Client-specific configuration hooks.

You can adapt this structure for your own manuscripts and use it as a baseline
for automated tests.
