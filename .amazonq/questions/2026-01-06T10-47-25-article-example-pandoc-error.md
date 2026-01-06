# Question summary

- **Context**: obsidian-latex-pdf project, exporting `article-example.md` using the `Article` template via Pandoc/xelatex.
- **User issue**: Pandoc export fails with LaTeX error `Please use \mathaccent for accents in math mode` pointing at a line containing `\SpecialStringTok{\}\^{}\{}` in the generated TeX.
- **Relation to previous questions**: First question in this session, no prior context to link.
- **What is unclear**: Exact LaTeX line around `\SpecialStringTok{\}\^{}\{}` and whether the error is caused by the markdown example, the Pandoc command-line options, or the LaTeX template/preamble.
- **Next steps**: Inspect example markdown, replicate the Pandoc command locally to capture the generated `.tex`, identify the problematic construct, and propose a minimal fix (either in markdown, Pandoc options, or LaTeX template) that allows math examples to compile.

# Outcomes / results

- Reproduced the failure locally using `examples/article-example.md` and the Article template; xelatex fails on a syntax-highlighted code block containing inline LaTeX math where Pandoc emits `\SpecialStringTok{\}\^{}\{}` inside a `Shaded/Highlighting` environment.
- Identified that the error is triggered by the fenced ```latex code block that itself contains `$$ ... \int_{-\infty}^{\infty} ... $$`; the generated TeX uses `\^{}` in a context that LaTeX treats as math accents, causing the `\mathaccent` error.
- Next step: propose practical fixes (short-term: adjust the example markdown; medium-term: consider avoiding math markup inside syntax-highlighted code blocks, or adjust Pandoc options/template if we want such examples to be supported).
