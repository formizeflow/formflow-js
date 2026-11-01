/**
 * Fluent form builder. Produces a FormDefinition that passes server validation:
 *   const def = form("Contact us").shortText("name", "Your name", { required: true }).email("email", "Email", { required: true })
 *     .choice("topic", "Topic", ["Sales", "Support"]).theme({ colors: { primary: "#e11d48" } }).ending("Thanks!").build();
 *   await ff.forms.create({ name: "Contact", definition: def });
 */
import type { Choice, Condition, Ending, FieldDefinition, FieldType, FormDefinition, FormSettings, LogicRule, Section, ThemeOverrides, Welcome } from "./resources/definition";

type Opts = Partial<Omit<FieldDefinition, "id" | "type" | "label">>;
type ChoiceInput = string | { label: string; id?: string; value?: string; points?: Record<string, number>; correct?: boolean; imageUrl?: string };

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40) || "choice";
const ID = /^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/;

export function choices(items: ChoiceInput[]): Choice[] {
  const used = new Set<string>();
  return items.map((c, i) => {
    const o = typeof c === "string" ? { label: c } : c;
    let id = o.id ?? slug(o.label);
    if (!/^[a-zA-Z]/.test(id)) id = `c_${id}`;
    while (used.has(id)) id = `${id}_${i}`;
    used.add(id);
    return { ...o, id };
  });
}

export class FormBuilder {
  private def: FormDefinition;
  private ids = new Set<string>();
  private section: Section | null = null;

  constructor(title: string) { this.def = { schemaVersion: 1, title, fields: [], sections: [], logic: [], endings: [] }; }

  description(text: string) { this.def.description = text; return this; }
  welcome(w: Welcome) { this.def.welcome = w; return this; }
  settings(s: FormSettings) { this.def.settings = { ...this.def.settings, ...s }; return this; }
  theme(t: ThemeOverrides) { this.def.theme = { ...this.def.theme, ...t, colors: { ...this.def.theme?.colors, ...t.colors } }; return this; }
  /** Start a new section/page; following fields go into it. */
  startSection(id: string, title?: string) { this.section = { id, title, fieldIds: [] }; this.def.sections!.push(this.section); return this; }
  logic(rule: LogicRule) { this.def.logic!.push(rule); return this; }
  ending(title: string, body?: string, extra: Partial<Ending> = {}) { this.def.endings!.push({ id: extra.id ?? `ending${this.def.endings!.length + 1}`, title, body, ...extra }); return this; }
  /** Show `fieldId` only when the condition holds. */
  showWhen(fieldId: string, when: Condition) {
    const f = this.def.fields.find((x) => x.id === fieldId);
    if (!f) throw new Error(`showWhen: unknown field "${fieldId}"`);
    f.visibleWhen = when;
    return this;
  }

  /** Any field type. Prefer the typed helpers below. */
  field(type: FieldType, id: string, label: string, opts: Opts & Record<string, unknown> = {}) {
    if (!ID.test(id)) throw new Error(`Invalid field id "${id}": start with a letter; use letters, digits, _ or -`);
    if (this.ids.has(id)) throw new Error(`Duplicate field id "${id}"`);
    this.ids.add(id);
    this.def.fields.push({ id, type, label, ...opts });
    this.section?.fieldIds.push(id);
    return this;
  }
  shortText(id: string, label: string, o: Opts = {}) { return this.field("short_text", id, label, o); }
  longText(id: string, label: string, o: Opts = {}) { return this.field("long_text", id, label, o); }
  email(id: string, label: string, o: Opts = {}) { return this.field("email", id, label, o); }
  phone(id: string, label: string, o: Opts = {}) { return this.field("phone", id, label, o); }
  url(id: string, label: string, o: Opts = {}) { return this.field("url", id, label, o); }
  number(id: string, label: string, o: Opts & { min?: number; max?: number } = {}) { return this.field("decimal", id, label, o); }
  date(id: string, label: string, o: Opts = {}) { return this.field("date", id, label, o); }
  yesNo(id: string, label: string, o: Opts = {}) { return this.field("yes_no", id, label, o); }
  /** Single choice by default; `{ multiple: true }` for multiple, `{ as: "dropdown" }` for a dropdown. */
  choice(id: string, label: string, items: ChoiceInput[], o: Opts & { multiple?: boolean; as?: "dropdown" | "image_choice" } = {}) {
    const { multiple, as, ...rest } = o;
    return this.field(as ?? (multiple ? "multiple_choice" : "single_choice"), id, label, { ...rest, choices: choices(items) });
  }
  rating(id: string, label: string, o: Opts & { max?: number } = {}) { return this.field("star_rating", id, label, { max: 5, ...o }); }
  nps(id: string, label = "How likely are you to recommend us to a friend or colleague?", o: Opts = {}) { return this.field("nps", id, label, { minLabel: "Not likely", maxLabel: "Very likely", ...o }); }
  csat(id: string, label: string, o: Opts = {}) { return this.field("csat", id, label, o); }
  fileUpload(id: string, label: string, o: Opts & { accept?: string[]; maxSizeMb?: number; multiple?: boolean } = {}) { return this.field("file_upload", id, label, o); }
  consent(id: string, label: string, text: string, o: Opts = {}) { return this.field("consent", id, label, { text, required: true, ...o }); }
  statement(id: string, label: string, o: Opts = {}) { return this.field("statement", id, label, o); }
  hidden(id: string, param = id) { return this.field("hidden", id, id, { source: "url_param", param }); }

  /** Field ids defined so far (for building logic rules). */
  get fieldIds() { return [...this.ids]; }
  /** Returns a deep copy. Final validation (references, cycles) happens on the server at create/publish. */
  build(): FormDefinition {
    if (!this.def.fields.length) throw new Error("A form needs at least one field");
    const out = structuredClone(this.def);
    if (!out.sections!.length) delete out.sections;
    if (!out.logic!.length) delete out.logic;
    if (!out.endings!.length) delete out.endings;
    return out;
  }
}

export const form = (title: string) => new FormBuilder(title);
