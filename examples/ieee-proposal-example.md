---
template: ieee-proposal
title: "Example IEEE Proposal: Obsidian LaTeX PDF"
author:
  - "Alice Researcher"
  - "Bob Engineer"
abstract: |
  This example note demonstrates how to structure a short technical proposal
  using the **IEEE Proposal (conference)** template. It shows how to declare
  title, authors, abstract, and optional keywords in frontmatter, and how a
  typical proposal might be organised into sections.
keywords:
  - "obsidian"
  - "pandoc"
  - "latex"
  - "ieee"
client: "demo-ieee-client"
---

# About this IEEE proposal example

The IEEE proposal template is based on the `IEEEtran` class in conference mode.
It is suitable for short research or engineering proposals submitted to
conferences, internal review boards, or technical steering groups.

## Frontmatter fields explained

- `template`: must be set to `ieee-proposal` so the plugin selects the correct
  LaTeX template.
- `title` (required): the proposal title.
- `author` (required): one or more authors; the LaTeX template formats them with
  an IEEE-style author block.
- `abstract` (recommended): a concise summary of the proposal; rendered in an
  `abstract` environment.
- `keywords` (optional): mapped to an IEEE-style `IEEEkeywords` section.
- `client` (optional): if a client-specific preamble exists at
  `clients/<client>/preamble.tex`, it can customise branding.

# Introduction

Explain the context and motivation for the proposed work. For example:

- What problem is being addressed?
- Why is it important?
- Who benefits from the solution?

Inline math works as usual, e.g. `$E = mc^2$`, and display equations can be
written using standard markdown math blocks.

# Background and related work

Provide a brief overview of related systems, prior work, or existing tools. This
section should justify why a new effort is needed and how it differs from or
improves on what already exists.

# Proposed approach

Describe the technical approach or methodology. A typical structure could be:

## System architecture

- High-level components of the solution.
- Data flow between components.
- Any external dependencies.

## Implementation plan

1. Prototype the export workflow with a subset of templates.
2. Add validation rules and user-visible feedback.
3. Integrate with existing deployment or CI tooling.

# Expected impact and evaluation

Explain how success will be measured:

- Quantitative metrics (e.g. export time, error rates).
- Qualitative metrics (e.g. user satisfaction, reduced manual formatting).

# Timeline and resources

Provide a rough timeline and resource estimate. For example:

- Phase 1 (2 weeks): prototype and initial feedback.
- Phase 2 (4 weeks): complete implementation and documentation.
- Phase 3 (2 weeks): polish, performance tuning, and rollout.

# Conclusion

Summarise the proposal in a few paragraphs and restate the key benefits. This
section should be suitable for readers who skim the document.
