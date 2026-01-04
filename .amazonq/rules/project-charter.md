# Project Charter: Obsidian LaTeX PDF Plugin

## Overview

This project provides an Obsidian desktop-only plugin that exports markdown notes to high-quality PDF using Pandoc and LaTeX templates (including kaobook and others). The plugin integrates with BRAT by hosting the code in a versioned GitHub repository and exposing standard Obsidian plugin metadata.

## Goals

- Allow users to choose from a list of LaTeX/Pandoc templates inside Obsidian.
- Run template-specific pre-checks on notes before export (YAML frontmatter, structure, resources).
- Provide precise, actionable feedback on validation issues.
- Invoke local Pandoc and LaTeX toolchain to generate academic-grade PDFs.

## Architecture (Initial)

- Obsidian plugin written in TypeScript.
- Template registry describing available templates and their requirements.
- Validation subsystem operating on Obsidian metadata (frontmatter, headings, links).
- Export subsystem invoking Pandoc and LaTeX via child_process.
- GitHub repository used for version control and BRAT distribution.

## Status

- IMPLEMENTED: Initial project scaffold (manifest, package.json, TypeScript entrypoint).
- IMPLEMENTED: GitHub repository with tagged version v0.1.1 suitable for BRAT (includes compiled main.js).
- IMPLEMENTED: Basic template registry, More options menu integration, and print modal UI wired to a pandoc/LaTeX export runner.
- PLANNED: Validation engine and additional templates.
