export interface TemplateDefinition {
  id: string;
  label: string;
  description: string;
}

const TEMPLATES: TemplateDefinition[] = [
  {
    id: "kaobook",
    label: "Kaobook (book layout)",
    description:
      "Book-style LaTeX template based on the kaobook class, suitable for longer structured documents.",
  },
  {
    id: "article",
    label: "Article",
    description:
      "Standard LaTeX article-style template, suitable for shorter papers and reports.",
  },
];

export function getAvailableTemplates(): TemplateDefinition[] {
  return TEMPLATES;
}

export function getTemplateById(id: string): TemplateDefinition | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
