import type { HttpClient, RequestOptions } from "../core";
import type { FormDefinition } from "./definition";

export type TemplateSummary = { id: string; name: string; description: string; category: string };
export type Template = TemplateSummary & { definition: FormDefinition };

export class TemplatesResource {
  constructor(private readonly h: HttpClient) {}
  list(q: { category?: string; q?: string } = {}, o?: RequestOptions) { return this.h.data<TemplateSummary[]>("GET", "/templates", { query: q, ...o }); }
  get(id: string, o?: RequestOptions) { return this.h.data<Template>("GET", `/templates/${id}`, o); }
  /** Template types (NPS, RSVP, order form...) with the designs each is offered in. Combine as `${typeId}--${designId}` for `get`. */
  types(q: { category?: string; q?: string; formType?: string; industry?: string; role?: string; tag?: string } = {}, o?: RequestOptions) { return this.h.data<Record<string, unknown>[]>("GET", "/templates/types", { query: q, ...o }); }
  /** Designs (theme, imagery, layout presets), optionally those that suit a template `category`. */
  designs(q: { category?: string } = {}, o?: RequestOptions) { return this.h.data<Record<string, unknown>[]>("GET", "/designs", { query: q, ...o }); }
  /** Dress a draft in a design. Never touches questions, copy, logic or scoring. */
  applyDesign(formId: string, designId: string, expectedRevision?: number, o?: RequestOptions) { return this.h.data<Record<string, unknown>>("POST", `/forms/${formId}/design`, { body: { designId, expectedRevision }, ...o }); }
  /** Curated question library; each entry's `spec` is a ready field to add with a new id. */
  questionBank(q: { category?: string; tag?: string; q?: string } = {}, o?: RequestOptions) { return this.h.data<Record<string, unknown>[]>("GET", "/question-bank", { query: q, ...o }); }
  /** Parse a product CSV (name, price, description, image, stock) into `choices` for a product field. Nothing is saved. */
  importProducts(csv: string, o?: RequestOptions) { return this.h.data<{ choices: Record<string, unknown>[]; skipped: unknown[] }>("POST", "/products/import", { body: { csv }, ...o }); }
}
