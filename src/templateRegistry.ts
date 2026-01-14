export type TemplateKind = "article" | "report" | "book" | "thesis" | "letter";

export interface TemplateDefinition {
  id: string;
  label: string;
  description: string;
  kind: TemplateKind;
  /**
   * Relative path (from the plugin root) to the Pandoc LaTeX template file
   * that should be passed via `--template` when using the direct backend.
   */
  pandocTemplateRelativePath?: string;
}

const TEMPLATES: TemplateDefinition[] = [
  {
    id: "article",
    label: "Article (A4)",
    description:
      "Standard A4 article-style template based on KOMA scrartcl, suitable for shorter papers and reports.",
    kind: "article",
    pandocTemplateRelativePath: "templates/article/template.tex",
  },
  {
    id: "report",
    label: "Report (A4)",
    description:
      "Standard A4 report-style template based on KOMA scrreprt, suitable for longer technical reports.",
    kind: "report",
    pandocTemplateRelativePath: "templates/report/template.tex",
  },
  {
    id: "kaobook",
    label: "Kaobook (book layout, A4)",
    description:
      "Book-style A4 template based on the kaobook class, suitable for books and long structured documents.",
    kind: "book",
    pandocTemplateRelativePath: "templates/kaobook/template.tex",
  },
  {
    id: "thesis-kaobook",
    label: "Thesis (kaobook, A4)",
    description:
      "Thesis/dissertation template built on kaobook, with abstract and acknowledgements front matter.",
    kind: "thesis",
    pandocTemplateRelativePath: "templates/thesis-kaobook/template.tex",
  },
  {
    id: "letter",
    label: "Letter (A4, scrlttr2)",
    description:
      "Business letter template based on KOMA-Script scrlttr2, suitable for A4 correspondence.",
    kind: "letter",
    pandocTemplateRelativePath: "templates/letter/template.tex",
  },
];

export function getAvailableTemplates(): TemplateDefinition[] {
  return TEMPLATES;
}

export function getTemplateById(id: string): TemplateDefinition | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
