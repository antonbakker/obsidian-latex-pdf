---
template: business-plan
title: "Example Business Plan: Obsidian LaTeX PDF"
company: "Example Productivity Solutions BV"
author:
  - "Anton Bakker"
  - "Product Strategy Team"
version: "1.0"
executive_summary: |
  This example note demonstrates how to structure a business plan using the
  **Business Plan (A4 report)** template. It includes a title page with company
  details, version, and date, followed by an optional executive summary and
  standard business-plan sections.
date: 2026-01-15
client: "internal-business"
---

# About this business plan example

The business plan template is based on the `scrreprt` class and is intended for
multi-page documents that describe a product, service, or initiative. It
provides a dedicated title page and supports an `executive_summary` frontmatter
field that is rendered as an unnumbered chapter before the main content.

## Frontmatter fields explained

- `template`: must be `business-plan`.
- `title` (required): the business plan title.
- `company` (recommended): the organisation responsible for the plan.
- `author` (recommended): one or more authors or responsible teams.
- `version` (optional but useful): used on the title page to track iterations.
- `executive_summary` (recommended): appears as a dedicated Executive Summary
  section at the start of the document.
- `date` (optional): if omitted, the LaTeX template defaults to `\today`.
- `client` (optional): used only if you rely on client-specific LaTeX preambles.

# Market analysis

Describe the target market and key trends.

## Target customers

- Primary customer segment(s).
- Their main pain points and needs.

## Competitor landscape

- Existing solutions and their strengths/weaknesses.
- Gaps in the market that this plan addresses.

# Product or service description

Explain what is being proposed:

- Core features and benefits.
- Unique selling points.
- Technology or operational model.

# Go-to-market strategy

Outline how the product or service will be launched and scaled.

## Pricing and packaging

- Pricing model (subscription, one-time, tiered pricing, etc.).
- Packaging options or bundles.

## Channels and promotion

- Sales channels (direct, partners, online marketplace).
- Marketing activities (content, events, campaigns).

# Operations and organisation

Describe how the plan will be executed operationally.

- Key roles and responsibilities.
- Dependencies on other teams or vendors.
- High-level process flows.

# Financial projections

Provide high-level projections (you can use markdown tables):

| Year | Revenue (estimate) | Costs (estimate) | Profit / (Loss) |
|:----:|-------------------:|-----------------:|----------------:|
| 2026 |             100000 |            80000 |           20000 |
| 2027 |             250000 |           150000 |          100000 |
| 2028 |             400000 |           230000 |          170000 |

# Risks and mitigations

List major risks and how they will be mitigated.

- Adoption risk – mitigated by early pilot programmes.
- Technical risk – mitigated by incremental rollout and robust testing.
- Operational risk – mitigated by clear runbooks and training.

# Conclusion

Summarise why the plan should be approved, including a concise restatement of
expected benefits, required investment, and projected returns.
