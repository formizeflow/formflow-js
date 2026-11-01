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

export class AiResource {
  constructor(private readonly h: HttpClient) {}
  /** Prompt to validated FormDefinition. With `create`, also saves a draft form. Uses AI credits. */
  generateForm(body: { prompt: string; presentation?: PresentationMode; audience?: string; create?: { name: string; folderId?: string } }, o?: RequestOptions) {
    return this.h.data<{ definition: FormDefinition; issues: DefinitionIssue[]; form?: Form }>("POST", "/ai/generate-form", { body, ...o });
  }
  /** AI summary of responses. Sensitive fields never reach the model. */
  analyzeResponses(formId: string, body: { question?: string; fieldIds?: string[]; filters?: Condition; maxSample?: number } = {}, o?: RequestOptions) {
    return this.h.data<AnalysisResult>("POST", `/forms/${formId}/ai/analyze`, { body, ...o });
  }
}
