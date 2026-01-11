# LaTeX template installation guide

This document describes how to install the LaTeX dependencies for each of the templates used by the **Obsidian LaTeX PDF** plugin on macOS with MacTeX.

The plugin itself only ships Pandoc *templates* (`templates/**/template.tex`). Most heavy lifting is done by your LaTeX distribution and any external classes/packages those templates rely on.

> NOTE: Commands below assume MacTeX is installed and `xelatex` is available at `/Library/TeX/texbin/xelatex`.

## General TeX user tree

On macOS, user-level LaTeX files can be placed under:

- `~/Library/texmf/tex/latex/<project-or-template>/`

XeLaTeX will automatically search this tree without additional configuration.

---

## Article (A4) template (`templates/article/template.tex`)

### Dependencies

- LaTeX class: `scrartcl` (KOMA-Script, included in MacTeX)
- Common packages: `graphicx`, `hyperref`, `longtable`, `booktabs`, etc. (all standard in MacTeX)

### Installation

No additional manual installation is usually required on MacTeX.

If you see missing package errors, install them via `tlmgr` or TeX Live Utility.

---

## Report template (`templates/report/template.tex`)

### Dependencies

- LaTeX class: typically `scrreprt`/`report` (KOMA-Script or standard LaTeX)
- Common packages: `graphicx`, `hyperref`, `longtable`, `booktabs`, etc.

### Installation

Same as **Article (A4)**: MacTeX already includes the required classes and packages.

---

## Thesis (kaobook) template (`templates/thesis-kaobook/template.tex`)

The thesis template is also based on **kaobook** and therefore shares the same requirements as the kaobook book template below. If kaobook is installed correctly, both templates should work.

---

## Kaobook template (`templates/kaobook/template.tex`)

This template uses the external **kaobook** class and the companion `kao` package. It also assumes a modern XeLaTeX/LuaLaTeX setup with Libertinus & Liberation fonts.

### Required LaTeX files

From the kaobook distribution (in this repo, see `github/obsidian-pandoc-templates/kaobook`):

- `kaobook.cls`
- `kao.sty`
- any other `*.sty` files shipped with kaobook (copied as a group)

Install them into your user TeX tree:

```bash
mkdir -p ~/Library/texmf/tex/latex/kaobook
cp ~/Development/github/obsidian-pandoc-templates/kaobook/*.cls \
   ~/Library/texmf/tex/latex/kaobook/
cp ~/Development/github/obsidian-pandoc-templates/kaobook/*.sty \
   ~/Library/texmf/tex/latex/kaobook/ 2>/dev/null || true
```

After this, `\documentclass{kaobook}` should work from any LaTeX document.

### Required fonts

The kaobook `kao` package (see `kao.sty`) configures fonts as follows when using the default `fontmethod=modern` (XeLaTeX/LuaLaTeX):

- Main text: `Libertinus Serif`
- Sans-serif: `Libertinus Sans`
- Math: `Libertinus Math`
- Monospace: `Liberation Mono`

#### Verify fonts are visible

You can check whether fontconfig sees these fonts with:

```bash
fc-list | egrep -i 'Libertinus|Liberation Mono'
```

You should see entries for:

- `Libertinus Serif`
- `Libertinus Sans`
- `Libertinus Math`
- `Libertinus Mono`
- `Liberation Mono` (or a compatible variant such as "Liberation Mono for Powerline")

If `Liberation Mono` is missing, XeLaTeX/fontspec will report:

> Package fontspec Error: The font "Liberation Mono" cannot be found

#### Install Libertinus fonts

If you don't have Libertinus yet, download the official Libertinus OTF bundle and install all `*.otf` files into your user fonts:

```bash
mkdir -p ~/Library/Fonts
cp /path/to/Libertinus/*.otf ~/Library/Fonts/
```

Re-run `fc-list | grep -i 'Libertinus'` to confirm.

#### Install Liberation Mono

Install the Liberation Mono font (or a compatible variant) at the OS level.

One approach is to install the Liberation font set and ensure `Liberation Mono` is present:

```bash
# Example: if you downloaded Liberation fonts as TTF
mkdir -p ~/Library/Fonts
cp /path/to/Liberation/LiberationMono-*.ttf ~/Library/Fonts/
```

Re-check visibility:

```bash
fc-list | grep -i 'Liberation Mono'
```

Once it appears in the list, kaobook should be able to load it.

> NOTE: It is normal to see entries such as `Liberation Mono for Powerline` or `Literation Mono Powerline` in addition to or instead of plain `Liberation Mono`. As long as one of the installed fonts exposes the family name **"Liberation Mono"**, XeLaTeX will resolve it.

### Testing kaobook from the command line

After installing the class and fonts, you can test a minimal document:

```bash
cd ~/Development/989646093931/obsidian-latex-pdf

echo "# Kaobook test" > /tmp/kaobook-test.md

/opt/homebrew/bin/pandoc /tmp/kaobook-test.md \
  --from=markdown+tex_math_dollars+raw_tex+link_attributes \
  --pdf-engine /Library/TeX/texbin/xelatex \
  --template templates/kaobook/template.tex \
  -o /tmp/kaobook-test.pdf
```

If this succeeds, Obsidian exports using the kaobook template should work as well.

---

## Client-specific preambles

Some templates support a `client` frontmatter field and look for a client-specific preamble:

- Example (kaobook template):

  ```latex
  $if(client)$
    \IfFileExists{clients/$client$/preamble.tex}{\input{clients/$client$/preamble.tex}}{}
  $endif$
  ```

To override fonts or styling per client, create:

- `templates/<template-name>/clients/<client>/preamble.tex`

For example, to override monospace fonts for kaobook for a given client:

```latex
% templates/kaobook/clients/demo-client/preamble.tex
\usepackage{fontspec}
\setmonofont{TeX Gyre Cursor}
```

Then, in your note frontmatter:

```yaml
---
client: "demo-client"
---
```

This preamble is loaded on top of the base template and can be used to adjust fonts, colors, or other layout aspects without modifying the upstream kaobook files.
