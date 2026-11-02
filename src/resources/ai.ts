import type { HttpClient, RequestOptions } from "../core";
import type { Condition, DefinitionIssue, FormDefinition, PresentationMode } from "./definition";
import type { Form } from "./forms";

export type AnalysisResult = {
  summary: string; themes: { label: string; count: number; examples?: string[] }[]; sentiment?: Record<string, number>;
  anomalies?: string[]; suggestedQuestions?: string[];
  /** Always show these to the reader. */
  caveats: string[]; sampleSize: number; totalResponses: number; excludedFields: unknown[]; aiGenerated: true; generatedAt: string; model?: string;
  [k: string]: unknown;
};

/** Work on a saved form's draft (`formId`) or on a definition you hold. */
export type AiSource = { formId?: string; definition?: FormDefinition };

export class AiResource {
  constructor(private readonly h: HttpClient) {}
  /** Prompt to validated FormDefinition. With `create`, also saves a draft form. Uses AI credits. */
  generateForm(body: { prompt: string; presentation?: PresentationMode; audience?: string; create?: { name: string; folderId?: string } }, o?: RequestOptions) {
    return this.h.data<{ definition: FormDefinition; issues: DefinitionIssue[]; form?: Form }>("POST", "/ai/generate-form", { body, ...o });
  }
  /** Edit a form from an instruction. Give `formId` (its draft) or `definition`. `apply` saves the draft and needs `formId` + `expectedRevision`; destructive edits also need `allowDestructive`. */
  edit(body: AiSource & { instruction: string; apply?: boolean; expectedRevision?: number; allowDestructive?: boolean }, o?: RequestOptions) {
    return this.h.data<{ definition: FormDefinition; changes: { kind: string; path: string; summary?: string; destructive?: boolean }[]; intents: string[]; hasDestructiveChanges: boolean; applied: boolean; draftRevision?: number; issues?: DefinitionIssue[] }>("POST", "/ai/edit", { body, ...o });
  }
  /** Translate form copy into one locale. With `apply` it merges into `settings.translations[locale]` of the draft. */
  translate(body: AiSource & { locale: string; keys?: string[]; apply?: boolean; expectedRevision?: number }, o?: RequestOptions) {
    return this.h.data<{ translations: Record<string, string>; provider: string; applied: boolean; draftRevision?: number }>("POST", "/ai/translate", { body, ...o });
  }
  /** Before/after wording per question. Proposal only. */
  rewrite(body: AiSource & { fieldIds?: string[]; tone?: string }, o?: RequestOptions) {
    return this.h.data<{ items: unknown[]; skipped: unknown[]; provider: string }>("POST", "/ai/rewrite", { body, ...o });
  }
  /** Vetted logic rule suggestions. Proposal only. */
  suggestLogic(body: AiSource, o?: RequestOptions) { return this.h.data<{ suggestions: { reason: string; rule: unknown }[]; dropped: unknown[]; provider: string }>("POST", "/ai/suggest-logic", { body, ...o }); }
  /** Natural language to a validated calculated-field expression, with a step-by-step explanation and test results on sample answers. Pass `expression` instead of `instruction` to explain and test an existing one (no AI credits). */
  writeFormula(body: AiSource & { instruction?: string; expression?: string; sample?: Record<string, unknown> }, o?: RequestOptions) { return this.h.data<{ expression: string; explanation: string; references: string[]; provider: string; steps: { expression: string; description: string; value?: string | number | boolean | null }[]; tests: { answers: Record<string, unknown>; result: string | number | boolean | null }[] }>("POST", "/ai/formula", { body, ...o }); }
  /** Form from pasted `text` or a base64 text document (txt, md, csv, tsv, json, html). With `create` also saves a draft. */
  importDocument(body: { text?: string; file?: { filename: string; contentBase64: string }; create?: { name: string; folderId?: string } }, o?: RequestOptions) {
    return this.h.data<{ definition: FormDefinition; issues: DefinitionIssue[]; form?: Form }>("POST", "/ai/import", { body, ...o });
  }
  /** Theme from a site `url`, a logo/`image` (base64) or a `prompt`. With `apply` + `formId` + `expectedRevision` it merges into the draft. */
  brandKit(body: { url?: string; image?: { contentBase64: string }; prompt?: string; formId?: string; apply?: boolean; expectedRevision?: number }, o?: RequestOptions) {
    return this.h.data<{ theme: Record<string, unknown>; palette: string[]; notes: string[]; aiGenerated: boolean; applied: boolean; draftRevision?: number }>("POST", "/ai/brand-kit", { body, ...o });
  }
  /** AI summary of responses. Sensitive fields never reach the model. */
  analyzeResponses(formId: string, body: { question?: string; fieldIds?: string[]; filters?: Condition; maxSample?: number } = {}, o?: RequestOptions) {
    return this.h.data<AnalysisResult>("POST", `/forms/${formId}/ai/analyze`, { body, ...o });
  }
}
