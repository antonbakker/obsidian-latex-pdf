---
template: koma-proposal
title: "Example Services Proposal: Obsidian LaTeX PDF"
client: "Example Manufacturing NV"
project: "Documentation and Reporting Platform"
proposal_id: "PR-2026-001"
author:
  - "Alice Consultant"
  - "Bob Architect"
date: 2026-01-15
---

# About this proposal example

The KOMA-Script proposal template is based on the `scrartcl` class and is
intended for client-facing proposals that need a clean A4 layout with a
structured header (client, project, proposal ID, date).

## Frontmatter fields explained

- `template`: must be `koma-proposal`.
- `title` (required): main proposal title, also shown prominently at the top of
  the first page.
- `client` (required): client name, displayed in the header block.
- `project` (recommended): short project name or summary.
- `proposal_id` (optional): internal identifier used in the header block.
- `author` (recommended): one or more authors or responsible consultants.
- `date` (optional): if omitted, defaults to `\today`.

# Executive summary

Provide a concise overview of the proposal:

- Client context and challenges.
- Proposed high-level solution.
- Expected outcomes and value.

# Current situation and objectives

Describe the client's current situation and the objectives of the engagement.

## Current situation

- Existing documentation and reporting tools.
- Pain points (manual processes, inconsistent output, lack of traceability).

## Objectives

- Automate generation of high-quality PDFs from structured markdown notes.
- Standardise templates across teams (reports, proposals, business plans).
- Improve validation and reduce export failures.

# Proposed solution

Outline the proposed solution at a level suitable for business stakeholders.

## Workstreams

1. **Template design** – define and implement LaTeX templates for key document
   types (reports, proposals, business plans).
2. **Plugin configuration** – configure the Obsidian LaTeX PDF plugin and
   validation rules.
3. **Rollout and training** – pilot with a subset of teams, then roll out more
   broadly.

## Deliverables

- Configured Obsidian vault and LaTeX environment.
- Template set (article, report, business plan, proposal, memo, etc.).
- Short user guide and quick-start examples.

# Planning and effort

Provide a high-level planning timeline and effort estimate.

| Phase | Description                    | Duration | Effort (days) |
|:------|:-------------------------------|:--------:|--------------:|
| 1     | Discovery and design           |  2 weeks |             6 |
| 2     | Implementation and validation  |  4 weeks |            12 |
| 3     | Pilot, rollout, and handover   |  2 weeks |             6 |

# Commercials (optional section)

Include pricing, assumptions, and payment terms as needed. This section is
intentionally left free-form so it can be adapted to your standard proposal
format.

# Acceptance

Summarise the acceptance criteria and provide a space for client sign-off (if
you export the final PDF and print it):

- Solution meets the described objectives.
- Agreed deliverables are provided.
- Project is completed within the agreed timeframe and budget.

This example is intended to be realistic enough for client proposals while still
being generic and safe to ship in the plugin repository.
