# Question analysis

- Context: When exporting a note with the obsidian-latex-pdf plugin using the kaobook template, xelatex fails with `LaTeX Error: File 'kaobook.cls' not found`.
- Actual question: Fix the kaobook export so it works on this machine and then create a new plugin release.
- Relation to prior questions: Related to previous Pandoc/LaTeX debugging in the same project, but this is a separate issue (missing LaTeX class rather than bad content).
- What is unclear: Whether the desired fix is purely local (install kaobook class into TeX) or should be encoded into the plugin repo (e.g. vendoring the class or documenting installation). For now, we aim for a local TeX configuration fix plus optional doc/release updates.
- How to improve results: Detect where `kaobook.cls` already lives on disk, add it to TeX's search path, verify Pandoc/xelatex works with the kaobook template, and then, if needed, update plugin docs/version.

# Outcome / results

- Investigation steps so far:
  - Confirmed the obsidian-latex-pdf repo has a `templates/kaobook/template.tex` file.
  - Confirmed that a separate repo `/Users/anton/Development/github/obsidian-pandoc-templates/kaobook` contains the `kaobook.cls` class file.
  - Verified that the LaTeX error is due to TeX not finding `kaobook.cls` in its search path.
- Planned fix:
  - Install or symlink the `kaobook.cls` (and any companion files) into the user TeX tree, e.g. `~/Library/texmf/tex/latex/kaobook`, so xelatex can find it.
  - Re-run Pandoc with the kaobook template to verify that the export succeeds.
  - Optionally add documentation to obsidian-latex-pdf explaining that kaobook requires installing the LaTeX class, and bump the plugin version for a new release if we change docs or config.
- Remaining work:
-  - Actually create the TeX tree directory, copy/symlink the required files, and run a test Pandoc command.
-  - Decide whether to modify the plugin repo (e.g. README or template docs) and tag a new release version.

# Update 2: Liberation Mono still not found by fontspec

- Validation: `fc-list` shows only `Liberation Mono for Powerline` / `Literation Mono Powerline` entries, not a plain `Liberation Mono` family.
- Interpretation: kaobook's `kao.sty` calls `\\setmonofont{Liberation Mono}`; since no font exposes exactly that family name to XeTeX/fontspec, it continues to fail even though compatible Powerline variants are installed.
- Decision: rather than patch the upstream `kao.sty`, we will use a client preamble (and/or template-level override) to set the monospace font to an installed family (e.g. `Libertinus Mono`), keeping the vendor files intact and making the fix explicit at the template/plugin level.
- Next actions: create a `templates/kaobook/clients/default/preamble.tex` with a `\\setmonofont{Libertinus Mono}` override and require `client: \"default\"` in kaobook-based notes; optionally document this override pattern in `_pandoc/TEMPLATE-INSTALLATION.md`.
