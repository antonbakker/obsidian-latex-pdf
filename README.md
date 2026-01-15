# Obsidian LaTeX PDF

Export Obsidian notes to PDF via Pandoc and LaTeX templates.

## Overview

This plugin adds an "Export to LaTeX PDF…" action to Obsidian for desktop. It
uses Pandoc and a small set of LaTeX templates to turn markdown notes into
high-quality PDFs with template-specific validation.

At a high level, the plugin:

- Reads the current note's YAML frontmatter.
- Lets you pick a LaTeX template (article, report, book, thesis, letter, memo,
  IEEE proposal, business plan, KOMA-Script proposal, …).
- Validates your frontmatter against the selected template.
- Invokes Pandoc/LaTeX (directly or via the existing Pandoc plugin) to render a
  PDF next to your note.

## Requirements

- Obsidian desktop (the plugin is desktop-only).
- A working Pandoc installation accessible from your PATH (for the direct
  backend) **or** the community "Pandoc" plugin configured for PDF export.
- A LaTeX distribution (TeX Live, MacTeX, MiKTeX, …) that provides the classes
  and packages used by the templates (e.g. `scrartcl`, `scrreprt`, `kaobook`,
  `scrlttr2`, `IEEEtran`, `tcolorbox`, etc.).

## Installation

1. Clone or download this repository.
2. Point Obsidian's Community Plugins "BRAT" plugin (or manual install) at this
   repo's release tag.
3. Enable **Obsidian LaTeX PDF** in Settings → Community plugins.

## Basic usage

### Export with template picker

- Open a markdown note with valid YAML frontmatter.
- Run the command palette action:
  - `Obsidian LaTeX PDF: Export current note to LaTeX PDF (choose template)`.
- A template picker dialog appears showing all registered templates.
- Select a template and confirm.
- The plugin validates your note, shows any errors/warnings, and when valid,
  runs Pandoc/LaTeX to generate a PDF in the same folder as your note.

You can also right-click a note in the file explorer and choose
**"Export to LaTeX PDF…"**.

### Export with default template

- In the plugin settings, pick a **Default template** (e.g. `article` or
  `business-plan`).
- Use the command:
  - `Obsidian LaTeX PDF: Export current note to LaTeX PDF (default template)`.
- The plugin skips the picker and directly uses your default template.

## Settings

Open **Settings → Plugin options → Obsidian LaTeX PDF**.

Key options:

- **Export backend**
  - `Use Pandoc plugin (recommended)`: delegates PDF generation to the existing
    Pandoc plugin. You must also choose a Pandoc plugin command.
  - `Direct pandoc (experimental)`: calls `pandoc` directly from this plugin.
- **Pandoc executable path** (direct backend only)
  - Path to the `pandoc` binary, e.g. `pandoc` or `/usr/local/bin/pandoc`.
- **PDF engine** (direct backend only)
  - One of `xelatex`, `lualatex`, or `pdflatex`.
- **PDF engine binary (advanced)**
  - Optional full path to the LaTeX engine binary, e.g.
    `/Library/TeX/texbin/xelatex`. Leave empty to use the engine name.
- **LaTeX profile preambles**
  - When enabled, notes with a `latex_pdf_profile` frontmatter field will include
    a matching preamble from the configured base directory.
- **LaTeX profile base directory**
  - Directory (absolute or relative to the vault) containing per-profile
    preambles in `<profile>/preamble.tex`.
- **Default template**
  - Template used when exporting via the "default template" command.
- **Pandoc plugin command** (when using the Pandoc backend)
  - Command from the Pandoc plugin that should be executed to produce a PDF.

## Templates

The plugin ships with a curated set of templates. Each template has:

- An internal ID (used in frontmatter and the registry).
- A human-readable label (shown in the UI).
- A `kind` (article/report/book/thesis/letter/memo).
- A LaTeX template file under `templates/`.

### Built-in templates

- `article` – A4 article (`scrartcl`).
- `report` – A4 technical report (`scrreprt`).
- `kaobook` – book-style layout (`kaobook`).
- `thesis-kaobook` – thesis/dissertation layout (`kaobook`).
- `letter` – business letter (`scrlttr2`).
- `memo` – A4 memo.
- `ieee-proposal` – IEEE-style conference proposal (`IEEEtran`).
- `business-plan` – Business plan with title page and executive summary
  (`scrreprt`).
- `koma-proposal` – General KOMA-Script proposal (`scrartcl`).

Refer to the `examples/` directory for a complete, ready-to-export note for
most templates (article, report, kaobook, thesis, memo, IEEE proposal, business
plan, and KOMA-Script proposal).

## Callouts

Markdown callouts of the form

- `> [!info] Text` (situation 1)
- `> [!info]` followed by text on the next lines (situation 2)
- `> [!info] Description` followed by text (situation 3)

are rendered via LaTeX environments defined in `templates/common/callouts.tex`.
The layout is:

- **Situation 1** – `> [!type] text`
  - Renders as: `<icon and label for type>` on the first line, then text inside
    a box with thin coloured lines above and below.
- **Situation 2** – `> [!type]` + text on following lines
  - Same layout as situation 1 (icon + type label, then text body).
- **Situation 3** – `> [!type] description` + text on following lines
  - Renders as: `<icon for type> description` on the first line, then text body
    in the same framed box.

Styling guarantees:

- No bold text is used in the callout header; emphasis is purely via colour and
  layout.
- The icon, header/label text, and horizontal lines all share the same
  severity-specific colour:
  - Info (note) callouts use `\\calloutInfoColor`.
  - Warning callouts use `\\calloutWarningColor`.
  - Tip/success callouts use `\\calloutTipColor`.
  - Generic note callouts use `\\calloutNoteColor`.

## Quick start by template

This section shows minimal frontmatter + body snippets you can paste into a new
note to get a working export. Adjust titles, authors, and other fields as
needed.

### Article (A4)

```yaml path=null start=null
---
template: article
title: "My first article"
author: "Your Name"
abstract: |
  Short summary of this article.
---

# Introduction

Write your article content here.
```

### Report (A4)

```yaml path=null start=null
---
template: report
title: "Project status report"
author: "Your Name"
abstract: |
  Brief overview of the current project status.
---

# Overview

Summarise the project.
```

### Kaobook (book)

```yaml path=null start=null
---
template: kaobook
title: "Example book"
subtitle: "A short guide"
author: "Your Name"
---

# Chapter 1 – Introduction

Start writing your book here.
```

### Thesis (kaobook)

```yaml path=null start=null
---
template: thesis-kaobook
title: "My thesis title"
author: "Student Name"
university: "Example University"
abstract: |
  One-paragraph abstract of the thesis.
---

# Chapter 1 – Introduction

Describe your research problem and context.
```

### Letter (A4, scrlttr2)

```yaml path=null start=null
---
template: letter
fromname: "Your Name"
fromaddress: |
  Street 1\\
  1234 AB City

toname: "Recipient Name"
toaddress: |
  Other Street 2\\
  5678 CD Town
subject: "Regarding our collaboration"
---

This is the body of the letter.
```

### Memo (A4)

```yaml path=null start=null
---
template: memo
memoto: "All stakeholders"
memofrom: "Your Name"
subject: "Project update"
---

This memo briefly summarises the current status.
```

### IEEE Proposal

```yaml path=null start=null
---
template: ieee-proposal
title: "Proposal: New export workflow"
author:
  - "Alice Researcher"
  - "Bob Engineer"
abstract: |
  Short technical summary of the proposed work.
---

# Introduction

Explain the motivation and context.
```

### Business plan

```yaml path=null start=null
---
template: business-plan
title: "Business plan for new service"
company: "Example Company BV"
author: "Your Name"
version: "1.0"
executive_summary: |
  High-level overview of the business plan.
---

# Market analysis

Describe your target market and competitors.
```

### KOMA-Script proposal

```yaml path=null start=null
---
template: koma-proposal
title: "Implementation proposal"
client: "Client Name"
project: "Project name"
proposal_id: "PR-2026-001"
---

# Executive summary

Summarise the proposal for the client.
```

## Frontmatter and validation details

The plugin validates each note before export using a schema that depends on the selected template. If any **error**-level issues are found, the Export button is disabled and PDF generation is blocked.

### Common behaviour

- A YAML frontmatter block at the top of the note is required.
- All templates require a non-empty `title`.
- The `author` field is recommended; it is a warning for most templates, but mandatory for theses.
- The `client` field is optional everywhere; when set, it must be non-empty.

### Article (A4) – `article`

Required / recommended fields:
- `title` (string) – **error** if missing.
- `author` (string or list) – **warning** if missing.

Optional fields:
- `date` (string, e.g. `YYYY-MM-DD`) – defaults to today when omitted.
- `abstract` (markdown string).
- `client` (string) – used to include `clients/<client>/preamble.tex` when present.

### Report (A4) – `report`

Required / recommended:
- `title` (string) – **error** if missing.
- `author` (string or list) – **warning** if missing.

Additional recommendations:
- `abstract` (markdown string) – **warning** if missing.

Optional:
- `date` (string) – defaults to today when omitted.
- `client` (string).

### Kaobook (book) – `kaobook`

Required / recommended:
- `title` (string) – **error** if missing.
- `author` (string or list) – **warning** if missing.

Additional recommendations:
- `abstract` (markdown string) – **warning** if missing.

Optional:
- `subtitle` (string).
- `date` (string).
- `client` (string).

### Thesis (kaobook) – `thesis-kaobook`

Required (block export if missing):
- `title` (string).
- `author` (string or list).
- `university` (string).
- `abstract` (markdown string).

Optional:
- `subtitle` (string).
- `date` (string).
- `acknowledgements` (markdown string).
- `client` (string).

### Letter (A4, scrlttr2) – `letter`

Required / recommended:
- `fromname` (string) – **error** if missing; sender name in the letterhead.
- `toname` (string) – **error** if missing; recipient name.
- `toaddress` (string / multiline) – **error** if missing; recipient postal address.

Optional but recommended:
- `subject` (string) – subject line of the letter.
- `opening` (string) – greeting (e.g. "Dear ...").
- `closing` (string) – closing formula (e.g. "Kind regards").

Optional:
- `title` (string) – internal/metadata title.
- `fromaddress` (string / multiline) – sender address.
- `place` (string) – city for the date line.
- `date` (string) – defaults to today when omitted.
- `signature` (string / multiline) – printed after the closing.
- `client` (string) – for client-specific preambles.

### Memo (A4) – `memo`

Required (block export if missing):
- `memoto` (string or multiline) – primary recipient(s).
- `memofrom` (string or multiline) – author or department.
- `subject` (string) – memo subject line.

Optional:
- `title` (string) – internal/metadata title.
- `date` (string) – defaults to today when omitted.
- `cc` (string or multiline) – additional recipients.
- `client` (string) – for client-specific preambles.

## Environment checks

The plugin also performs basic environment-level checks to reduce the chance of failed exports:

- Verifies that the LaTeX template file exists for the selected template.
- In **direct** backend mode:
  - Ensures the `Pandoc executable path` is non-empty.
  - Warns if a `PDF engine binary` is configured but effectively empty.

Errors found by environment checks are treated the same as frontmatter errors: they appear in the validation list and block export until resolved.
