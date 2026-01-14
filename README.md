# Obsidian LaTeX PDF

Export Obsidian notes to PDF via Pandoc and LaTeX templates.

## Frontmatter and validation details

The plugin validates each note before export using a schema that depends on the selected template. If any **error**-level issues are found, the Export button is disabled and PDF generation is blocked.

### Common behaviour

- A YAML frontmatter block at the top of the note is required.
- All templates require a non-empty `title`.
- The `author` field is recommended; it is a warning for most templates, but mandatory for theses.
- The `client` field is optional everywhere; when set, it must be non-empty.

### Article (A4) – `article`

Required / recommended fields:
- `title` (string) – **error** if missing.
- `author` (string or list) – **warning** if missing.

Optional fields:
- `date` (string, e.g. `YYYY-MM-DD`) – defaults to today when omitted.
- `abstract` (markdown string).
- `client` (string) – used to include `clients/<client>/preamble.tex` when present.

### Report (A4) – `report`

Required / recommended:
- `title` (string) – **error** if missing.
- `author` (string or list) – **warning** if missing.

Additional recommendations:
- `abstract` (markdown string) – **warning** if missing.

Optional:
- `date` (string) – defaults to today when omitted.
- `client` (string).

### Kaobook (book) – `kaobook`

Required / recommended:
- `title` (string) – **error** if missing.
- `author` (string or list) – **warning** if missing.

Additional recommendations:
- `abstract` (markdown string) – **warning** if missing.

Optional:
- `subtitle` (string).
- `date` (string).
- `client` (string).

### Thesis (kaobook) – `thesis-kaobook`

Required (block export if missing):
- `title` (string).
- `author` (string or list).
- `university` (string).
- `abstract` (markdown string).

Optional:
- `subtitle` (string).
- `date` (string).
- `acknowledgements` (markdown string).
- `client` (string).

### Letter (A4, scrlttr2) – `letter`

Required / recommended:
- `fromname` (string) – **error** if missing; sender name in the letterhead.
- `toname` (string) – **error** if missing; recipient name.
- `toaddress` (string / multiline) – **error** if missing; recipient postal address.

Optional but recommended:
- `subject` (string) – subject line of the letter.
- `opening` (string) – greeting (e.g. "Dear ...").
- `closing` (string) – closing formula (e.g. "Kind regards").

Optional:
- `title` (string) – internal/metadata title.
- `fromaddress` (string / multiline) – sender address.
- `place` (string) – city for the date line.
- `date` (string) – defaults to today when omitted.
- `signature` (string / multiline) – printed after the closing.
- `client` (string) – for client-specific preambles.

## Environment checks

The plugin also performs basic environment-level checks to reduce the chance of failed exports:

- Verifies that the LaTeX template file exists for the selected template.
- In **direct** backend mode:
  - Ensures the `Pandoc executable path` is non-empty.
  - Warns if a `PDF engine binary` is configured but effectively empty.

Errors found by environment checks are treated the same as frontmatter errors: they appear in the validation list and block export until resolved.
