# Project Charter: Obsidian LaTeX PDF Plugin

## Overview

This project provides an Obsidian desktop-only plugin that exports markdown notes to high-quality PDF using Pandoc and LaTeX templates (including kaobook and related layouts). The plugin is distributed via a GitHub repository and is suitable for BRAT-based installation by pointing to tagged releases.

## Goals

- Allow users to choose from a curated list of LaTeX/Pandoc templates inside Obsidian.
- Run template-specific pre-checks on notes before export (YAML frontmatter, structure, resources).
- Provide precise, actionable feedback on validation issues directly in the UI before running Pandoc.
- Invoke the local Pandoc and LaTeX toolchain to generate academic-grade PDFs.
- Keep plugin versioning and release metadata consistent across manifest.json, package.json, and versions.json.

## Architecture (Current)

- Obsidian plugin written in TypeScript, compiled to a single CommonJS entrypoint (main.js) via esbuild.
- Template registry describing available templates (article, report, kaobook book, thesis, letter, memo, IEEE proposal, business plan, KOMA-Script proposal) and their Pandoc template paths.
- Validation subsystem operating on Obsidian metadata (frontmatter, optional client metadata) with template-specific rules for thesis documents.
- Export subsystem invoking Pandoc via a dedicated runner (pandocRunner) that prepares a temporary markdown file and resolves the LaTeX template path.
- UI layer composed of:
  - A command palette entry and file-menu integration ("Export to LaTeX PDF…") for markdown files.
  - A TemplatePickerModal for selecting templates.
  - A PrintModal that shows validation results and triggers export.
- Settings tab for configuring export backend (direct vs Pandoc plugin), pandoc path, PDF engine, default template, and the Pandoc plugin command.
- GitHub repository used for version control, BRAT distribution, and release tagging.
- Node-based release helper script (scripts/release.js) plus npm scripts to bump versions in a controlled way.

## Implemented Functionality

- Core plugin lifecycle:
  - Loads settings with sensible defaults for pandoc path, PDF engine, and default template.
  - Registers two commands: export with template picker and export with default template.
  - Adds an "Export to LaTeX PDF…" item to the file menu for markdown notes.

- Template management:
-  - Template registry with multiple built-in templates: article, report, kaobook book, thesis (kaobook based), letter, memo, IEEE proposal, business plan, and a general KOMA-Script proposal.
-  - Each template defines a human-readable label, description, kind (article/report/book/thesis/letter/memo), and a relative path to the LaTeX template used by Pandoc.

- Validation engine:
  - Uses Obsidian's metadata cache to inspect YAML frontmatter.
  - Enforces presence of a frontmatter block; missing frontmatter is treated as a blocking error.
  - Checks for required fields such as title (error if missing).
  - Emits warnings for recommended fields such as author.
  - Applies template-specific rules for thesis templates (e.g. university and abstract fields as warnings if missing).
  - Optionally validates a client field when present, warning if it is empty.
  - Surfaces validation results in the PrintModal with a summary and per-issue list.

- Export pipeline:
  - Preprocesses the note into a temporary markdown file.
  - Resolves the appropriate Pandoc template from the plugin source tree.
  - Invokes Pandoc with a configurable PDF engine (xelatex, lualatex, or pdflatex).
  - Writes the resulting PDF alongside the source note in the vault.
  - Displays notices for success and failure.
  - Supports two backends from the settings tab:
    - Direct invocation of Pandoc.
    - Delegation to an existing Obsidian Pandoc plugin command.

- Settings UI:
  - Lets users choose the export backend.
  - Configures pandoc executable path and PDF engine.
  - Allows selection of a default template from the registry.
  - When using the Pandoc plugin backend, lists available Pandoc commands and lets users bind one as the PDF-export command.

- Release and versioning:
  - package.json, manifest.json, and versions.json kept in sync via scripts/release.js.
  - npm scripts release:patch, release:minor, and release:major call the release helper to bump semantic versions.
  - versions.json maps plugin versions to minimum Obsidian app versions to support BRAT and community distribution.

- Examples and fixtures:
  - An examples/ directory contains comprehensive markdown notes for each supported template (article, report, kaobook, thesis-kaobook).
  - Each example note doubles as user-facing documentation and a regression test fixture for template and validation behaviour.

- Testing infrastructure:
  - Vitest is configured as the test runner with TypeScript support.
  - Initial unit tests cover the template registry and validation rules in isolation using mocked Obsidian types.

## Work in Progress / Near-Term Improvements

- Enhance the pandocRunner preprocessor to support fenced directive blocks (e.g. ```latex-header```) for injecting custom LaTeX header content.
- Expand the template registry with more templates and richer metadata (e.g. required frontmatter fields per template, cover pages, institutional styles). Recent work added IEEE proposal, business plan, and KOMA-Script proposal templates including dedicated frontmatter validation schemas.
- Replace hard-coded filesystem paths in pandocRunner with configuration or environment-based resolution to improve portability.
- Integrate a proper linting setup (e.g. ESLint + TypeScript) and add automated tests for:
  - Template registry behaviour.
  - Validation rules.
  - Release/version bump logic.

## Future Ideas / Wishlist

- Add richer validation rules (section structure, bibliography presence, figure/table references) tailored per template kind.
- Provide presets for common academic institutions or journals.
- Offer a guided export wizard that suggests corrections before running Pandoc.
- Integrate with CI pipelines for automated PDF generation from a Git repository.
- Optional auto-release integration (e.g. git hooks or CI jobs) that call the existing release scripts to bump versions and tag releases on push.
