import type { HttpClient, RequestOptions } from "../core";
import type { FormDefinition } from "./definition";

export type TemplateSummary = { id: string; name: string; description: string; category: string };
export type Template = TemplateSummary & { definition: FormDefinition };

export class TemplatesResource {
  constructor(private readonly h: HttpClient) {}
  list(q: { category?: string; q?: string } = {}, o?: RequestOptions) { return this.h.data<TemplateSummary[]>("GET", "/templates", { query: q, ...o }); }
  get(id: string, o?: RequestOptions) { return this.h.data<Template>("GET", `/templates/${id}`, o); }
}
