# Question analysis

- Context: Obsidian LaTeX PDF plugin running in the obsidian-latex-pdf project fails to export `~/obsidian/projects/_pandoc/article-example.md` to PDF via Pandoc/xelatex.
- Actual question: Why does Pandoc/xelatex fail with `Please use \mathaccent for accents in math mode` on a line containing `Let $E = mc^2$`, and how to fix it?
- Relation to prior questions: None; this is a standalone debugging question.
- What is unclear: Whether the user prefers fixing the markdown content, changing how the example demonstrates code, or adjusting Pandoc/template settings. The immediate goal is to make the sample document compile.
- How to improve results: Inspect the generated LaTeX, identify the exact failing line, and propose the minimal change to the markdown so that the PDF exports cleanly while still showing the intended example.

# Outcome / results

- Investigation steps:
  - Reproduced the Pandoc command used by the plugin to confirm the error.
  - Regenerated LaTeX output (`article-example.tex`) from the markdown file.
  - Located line 228 in the LaTeX file where the error occurs.
  - Mapped that line back to the markdown source.
- Root cause:
  - Inside a fenced code block meant to show markdown literally, the line `Let $E = mc^2$ be the famous equation.` appears without escaping the dollar signs.
  - Pandoc’s syntax highlighting turns this into a `Highlighting` environment where the contents are tokenized; the `$` characters start and end math mode, and the caret is rendered as `\^`, which is a text accent macro.
  - Using `\^` (a text accent) in math mode triggers `Please use \mathaccent for accents in math mode.`
- Fix applied/suggested:
  - Update the code block in `~/obsidian/projects/_pandoc/article-example.md` so all dollar signs inside that fenced block are escaped, e.g. `Let \\$E = mc^2\\$ be the famous equation.` and similarly escape `$$` lines as `\\$\\$`.
  - After escaping the `$` characters, Pandoc will generate `\NormalTok{Let \\$E = mc\^{}2\\$ be the famous equation.}`, which stays in text mode, and the PDF export succeeds.
- Remaining work:
  - Optionally simplify that example section so it doesn’t re-explain escaping inside the same document, or switch the code block language to `text`/`none` to avoid syntax highlighting interactions.
