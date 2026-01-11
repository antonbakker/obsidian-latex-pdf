---
title: "Example Thesis: Obsidian LaTeX PDF"
subtitle: "Demonstrating the thesis (kaobook) template"
author:
  - "Student Name"
  - "Supervisor Name"
date: 2026-01-05
abstract: |
  This example note demonstrates how to structure a thesis or dissertation
  document using the **Thesis (kaobook, A4)** template. It exercises thesis-
  specific frontmatter fields such as `university` and `acknowledgements` that
  the template and validator are aware of.
university: "Example University of Technology"
acknowledgements: |
  I would like to thank my supervisor, colleagues, friends, and family for
  their support during the preparation of this thesis.
# Use the "default" client so the thesis kaobook template picks up the
# templates/kaobook/clients/default/preamble.tex preamble, which overrides
# the monospace font away from Liberation Mono.
client: "default"
keywords:
  - "obsidian"
  - "pandoc"
  - "latex"
  - "thesis"
---

# About this thesis example

The thesis template builds on `kaobook` and adds front-matter elements that are
common in academic theses:

- University / institution name.
- Abstract chapter.
- Acknowledgements chapter.

The plugin's validation logic includes additional checks for thesis templates,
so this note is particularly important for regression testing.

## Frontmatter fields explained

- `title` and `subtitle`: main thesis title and optional subtitle.
- `author`: primary author and optionally supervisor or committee members.
- `date`: submission or defence date.
- `abstract`: rendered as an `Abstract` chapter in the front matter.
- `university`: used for publisher metadata in the LaTeX template.
- `acknowledgements`: rendered as a dedicated acknowledgements chapter.
- `client`: optional; can be used to select institution-specific styling.

Validation behaviour (current implementation):

- If `title` is missing: **error**.
- If `author` is missing: **warning** (recommended but not strictly required).
- For thesis templates:
  - If `university` is missing: **warning**.
  - If `abstract` is missing: **warning**.

This example sets all of these fields so that validation should pass with only
informational or no warnings.

# Chapter 1 – Introduction

Introduce the research problem, context, and motivation.

## 1.1 Problem statement

Clearly describe the problem your thesis addresses.

## 1.2 Contributions

List the main scientific or practical contributions:

1. A new method for exporting structured notes to LaTeX-based PDFs.
2. A validation engine that provides feedback before compilation.
3. A reusable template set for academic documents.

# Chapter 2 – Background

Provide theoretical background, related work, and necessary definitions.

# Chapter 3 – Methodology

Explain your research methodology, experiments, or case studies.

# Chapter 4 – Results

Present your findings, including figures and tables where appropriate.

## Example figure

```markdown
![Thesis result chart](images/thesis-results.png){ width=70% }
```

## Example table

| Experiment | Configuration      | Result metric |
|:-----------|:-------------------|--------------:|
| E1         | Baseline           |         0.845 |
| E2         | Improved pipeline  |         0.903 |

# Chapter 5 – Discussion and conclusion

Summarise the results, discuss limitations, and outline future work.

# Appendix A – Additional material

Appendices can hold proofs, long tables, or code listings.

This note is designed so that:

- The validator can detect that thesis-specific metadata is present.
- Exports via the thesis template produce a realistic-looking sample thesis.
- Future changes to the validator and templates can be tested against this
  concrete example.
