/** Form definition types (mirror of the server model; keep in sync with openapi.json components.schemas). */
export type FieldType =
  | "short_text" | "long_text" | "email" | "phone" | "url" | "name" | "address" | "company" | "job_title" | "secret"
  | "integer" | "decimal" | "currency" | "percentage" | "number_range" | "date" | "time" | "datetime" | "duration"
  | "country" | "region" | "postal_code" | "timezone"
  | "single_choice" | "multiple_choice" | "dropdown" | "multi_select" | "image_choice" | "icon_choice" | "ranking" | "matrix" | "likert" | "yes_no" | "toggle"
  | "star_rating" | "rating" | "nps" | "emoji_rating" | "slider" | "csat" | "ces" | "opinion_scale"
  | "file_upload" | "product" | "quantity" | "coupon" | "payment" | "order_summary" | "donation"
  | "hidden" | "calculated" | "consent" | "legal" | "signature" | "appointment" | "location" | "barcode" | "statement" | "custom" | "ai_followup" | "repeating_group";

export type MediaLayout = "stack" | "split_left" | "split_right" | "wallpaper" | "float_left" | "float_right";
export type Media = {
  kind: "image" | "video"; url: string; alt?: string; layout?: MediaLayout; focalPoint?: { x: number; y: number }; brightness?: number; autoplay?: boolean;
  /** bleed = edge to edge (default); inset = framed with margins. */
  frame?: "bleed" | "inset"; fit?: "cover" | "contain";
  /** Inset corner radius, px. */
  radius?: number;
  /** Share of the screen in split layouts, 20-80 (default 50). */
  ratio?: number;
  /** Stacked banner height on phones, px (60-600). */
  mobileHeight?: number;
  /** Wallpaper scrim 0-1; 0 is honored. */
  scrim?: number;
  textTone?: "light" | "dark";
  /** Inset frame size in a split layout as a share of its half, 30-100. */
  size?: number;
  /** Wallpaper: fade the edges into the screen colour, 0-1. */
  vignette?: number;
  /** Welcome cover art only: soft edge or cut-out shape. */
  mask?: "none" | "feather" | "circle" | "arch" | "blob" | "brush" | "shield" | "leaf";
  /** Shown whole at its own aspect ratio (transparent png and svg art); svg urls default to on. */
  intrinsic?: boolean;
  /** Welcome cover art only: width in px, 80-1200. */
  width?: number;
};

export type ConditionOperator =
  | "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "contains" | "not_contains" | "starts_with" | "ends_with" | "matches"
  | "is_empty" | "is_not_empty" | "includes_any" | "includes_all" | "includes_none" | "before" | "after";
export type ConditionSource =
  | { kind: "field" | "variable"; id: string } | { kind: "url_param"; name: string } | { kind: "respondent"; attribute: string } | { kind: "attribute"; name: string } | { kind: "now" }
  /** Running lead score; not usable inside leadScoring rules. */
  | { kind: "lead_score" }
  /** Quiz score of one scoring dimension. */
  | { kind: "score"; dimension: string };
export type SimpleCondition = { type: "condition"; source: ConditionSource; operator: ConditionOperator; value?: string | number | boolean | string[] | null };
export type Condition = SimpleCondition | { type: "group"; combinator: "and" | "or"; conditions: Condition[] };

export type Choice = {
  id: string; label: string; /** Product rows: a line under the name. */ description?: string; value?: string; imageUrl?: string; icon?: string; points?: Record<string, number>; correct?: boolean; price?: string;
  variants?: { id: string; label: string; price?: string }[];
  /** Show "Free" for a zero price. */
  free?: boolean;
  /** Reaction line shown when this choice is selected. Supports piping. */
  response?: string;
  /** Hidden unless this holds (attributes, earlier answers). */
  visibleWhen?: Condition;
};

export type LogicAction =
  | { type: "show_field" | "hide_field" | "jump_to_field" | "require_field" | "disable_field" | "enable_field"; fieldId: string }
  /** The server computes the value and overrides what the client sent. */
  | { type: "set_value"; fieldId: string; expression: string }
  | { type: "show_section" | "hide_section" | "jump_to_section"; sectionId: string }
  | { type: "end_form"; endingId?: string } | { type: "redirect"; url: string }
  | { type: "set_variable"; variableId: string; expression: string } | { type: "set_message"; messageId: string; text: string }
  | { type: "select_ending"; endingId: string } | { type: "trigger_workflow"; workflowId: string };
export type LogicRule = { id: string; name?: string; order?: number; when: Condition; then: LogicAction[]; afterSectionId?: string };

export type ValidationRule =
  | { type: "min_length" | "max_length" | "min_selections" | "max_selections" | "min" | "max"; value: number; message?: string }
  | { type: "pattern"; value: string; message?: string } | { type: "expression"; expression: string; message: string };

/** Properties shared by every field. Type-specific properties (choices, min, max, currency...) are listed in the field catalog. */
export interface FieldDefinition {
  id: string;
  type: FieldType;
  label: string;
  description?: string;
  helpText?: string;
  placeholder?: string;
  required?: boolean;
  readOnly?: boolean;
  /** Starts disabled; enable_field rules can lift it. The server ignores what the client sends for it. */
  disabled?: boolean;
  hidden?: boolean;
  defaultValue?: unknown;
  validations?: ValidationRule[];
  visibleWhen?: Condition;
  errorMessage?: string;
  ariaLabel?: string;
  explanation?: string;
  /** Excluded from AI, notifications and default exports. */
  sensitive?: boolean;
  integrationKey?: string;
  media?: Media;
  buttonLabel?: string;
  trackAnalytics?: boolean;
  /** Column span in page layouts; adjacent fields share a row. */
  width?: "full" | "half" | "third";
  /** Text inputs: placeholders cycled while empty and unfocused (max 10). */
  placeholders?: string[];
  /** Leading icon in single-line text inputs: lucide icon name in kebab-case. */
  icon?: string;
  /** Skip the question when prefill, the named attribute (default: the field id) or the profile lookup already gives a value; it is recorded with source "profile". */
  skipIfKnown?: boolean | { attribute?: string };
  /** Classify the open-text answer into one of these categories with AI; the category id is stored in the variable `variableId`. */
  classify?: { variableId: string; categories: { id: string; label: string; hint?: string }[]; fallbackCategory?: string; minConfidence?: number };
  /** Rewrite this field's label for the respondent with AI, within these limits. */
  personalize?: { enabled?: boolean; maxLength?: number; guidance?: string };
  /** ai_followup: the field whose answer triggers the question, and the author's limits. */
  afterFieldId?: string; intent?: string; tone?: string; maxQuestionLength?: number; answerTypes?: ("text" | "choice")[]; fallbackQuestion?: string; fallbackChoices?: string[];
  /** short_text and phone: 9 = digit, a = letter, * = either, other characters are literals, "\\" escapes. Example "(999) 999-9999". */
  mask?: string;
  /** email and phone: the respondent proves ownership with a one-time code before submitting. */
  verify?: boolean;
  /** file_upload: record in the browser. The recording is stored as an ordinary upload. */
  record?: "video" | "audio" | "either";
  maxDurationSec?: number;
  /** file_upload with record: also offer file upload (default true). */
  allowUpload?: boolean;
  /** address: server-proxied suggestions; manual entry always works. */
  autocomplete?: boolean;
  /** Choice fields. */
  choiceLayout?: "stack" | "columns" | "hug" | "flow";
  columns?: number;
  hideKeys?: boolean;
  /** image_choice. tile = art on a padded tile with the label under it. */
  cardStyle?: "card" | "inset" | "art" | "tile";
  cardSize?: "sm" | "md" | "lg";
  imageAspect?: "square" | "portrait" | "landscape" | "auto";
  badgePlacement?: "top_left" | "top_right" | "bottom_left" | "bottom_right" | "inline";
  choices?: Choice[];
  randomize?: boolean;
  allowOther?: boolean;
  min?: number;
  max?: number;
  step?: number;
  [typeSpecific: string]: unknown;
}

export type Section = {
  id: string; title?: string; description?: string; fieldIds: string[]; visibleWhen?: Condition;
  /** Fields repeat as a list of entries; answers are an array of rows under answers[section.id]. */
  repeatable?: boolean; minItems?: number; maxItems?: number; itemLabel?: string; addLabel?: string;
  titlePlacement?: "inside" | "above";
  /** group = all fields on one screen in question modes. */
  layout?: "default" | "group";
  collapsible?: boolean; defaultOpen?: boolean; tint?: string; stickyHeader?: boolean;
};
export type Ending = {
  id: string; title: string; body?: string; redirectUrl?: string; ctaLabel?: string; ctaUrl?: string; when?: Condition; showScore?: boolean; allowDownload?: boolean; media?: Media; share?: boolean;
  /** Chained ending: a continue button leads here. */
  nextEndingId?: string;
};
export type Welcome = {
  title: string; description?: string; buttonLabel?: string; media?: Media;
  /** The media carries the title; the text stays for screen readers. */
  hideTitle?: boolean;
  /** Show the first question on the cover, no start button. */
  inlineFirst?: boolean;
  align?: "left" | "center";
  mediaPosition?: "top" | "bottom";
  /** The media is a title lockup shown whole and unframed. */
  lockup?: boolean;
};

export type Scoring = {
  enabled: boolean; dimensions?: string[]; passThreshold?: number;
  outcomes?: { id: string; label: string; dimension: string; min?: number; max?: number; endingId?: string; when?: Condition; redirectUrl?: string }[];
  outcomeMode?: "range" | "highest"; showCorrectAnswers?: boolean;
};
export type LeadScoring = { rules: { when: Condition; points: number }[]; tiers?: { label: string; min: number }[] };

/** Landing blocks around the form. `embed` runs in a sandboxed iframe and needs a role allowed to add custom code. */
type BlockBase = { id: string; place?: "before" | "after" };
export type PageBlock = BlockBase & (
  | { kind: "hero"; heading: string; body?: string; imageUrl?: string; imageAlt?: string; ctaLabel?: string }
  | { kind: "text"; heading?: string; body: string }
  | { kind: "image"; url: string; alt?: string; caption?: string }
  | { kind: "testimonial"; quote: string; author: string; role?: string; avatarUrl?: string }
  | { kind: "faq"; heading?: string; items: { q: string; a: string }[] }
  | { kind: "footer"; text?: string; links?: { label: string; url: string }[] }
  | { kind: "embed"; title?: string; html: string; height?: number }
);
export type PresentationMode = "standard" | "multi_step" | "conversational" | "chat" | "landing" | "assessment";

export type NotificationSettings = {
  ownerEmails?: string[];
  respondentReceipt?: { emailFieldId: string; subject: string; body: string; includeAnswers?: boolean };
  /** Extra emails sent only when a rule matches; recipients and text may come from answers. */
  rules?: { id: string; name?: string; when: Condition; to?: string[]; toFieldIds?: string[]; subject?: string; body?: string; includeAnswers?: boolean }[];
};
export type FormSettings = {
  presentation?: PresentationMode;
  showProgress?: boolean; allowBack?: boolean; reviewBeforeSubmit?: boolean; allowResume?: boolean; savePartials?: boolean;
  /** ISO date-time. The form shows a "not open yet" state until then. */
  openAt?: string;
  closeAt?: string; maxResponses?: number; oneResponsePerRespondent?: boolean; requireIdentity?: boolean; randomizeFieldOrder?: boolean;
  locale?: string; submitLabel?: string; captcha?: boolean; honeypot?: boolean;
  showQuestionNumbers?: boolean; showTimeToComplete?: boolean; autoAdvance?: boolean;
  /** false hides the "Made with FormFlow" badge; needs a plan that includes removeBranding, otherwise ignored. */
  branding?: boolean;
  /** Completions faster than this many ms are filed as spam. */
  minCompletionMs?: number;
  quotas?: { id: string; when: Condition; limit: number }[];
  landing?: { heading: string; body?: string; heroImageUrl?: string };
  navStyle?: "chevrons" | "pager" | "link" | "arrow" | "none";
  showTitle?: boolean; showStepLabel?: boolean; showEnterHint?: boolean; showOkIcon?: boolean;
  nextLabel?: string; timeHint?: string; confirmAnswers?: boolean; swipeNavigation?: boolean;
  brandPosition?: "left" | "center" | "right"; brandStyle?: "badge" | "chip" | "text";
  /** One image held across every screen. */
  sidePanel?: { mask?: "none" | "rounded" | "arch" | "circle"; url?: string; alt?: string; side?: "left" | "right"; ratio?: number; color?: string; fit?: "cover" | "contain"; mobile?: "banner" | "hide" };
  header?: { kind?: "banner" | "illustration"; url: string; alt?: string; height?: number; align?: "left" | "center" };
  i18n?: { switcher?: boolean; autoDetect?: boolean };
  offline?: { enabled: boolean; maxFileMb?: number };
  /** Shared-device mode: resets after submit and when idle. */
  kiosk?: { enabled: boolean; idleSeconds?: number; resetSeconds?: number };
  softCap?: { graceResponses?: number; warnAtPercent?: number };
  blocks?: PageBlock[];
  /** Signed link sent to the respondent to change answers later; every change is kept. */
  respondentEdit?: { enabled: boolean; expiresDays?: number };
  /** Onboarding: resume by uid, signed identity and opt-in AI. */
  personalization?: { resumeByUid?: boolean; resumeTtlHours?: number; requireSignedUid?: boolean; ai?: { enabled?: boolean; maxFollowUps?: number; consentFieldId?: string } };
  /** Analytics and ad pixels; shape is documented in /developers/form-builder. */
  tracking?: Record<string, unknown>;
  notifications?: NotificationSettings;
  seo?: { title?: string; description?: string; imageUrl?: string; noindex?: boolean };
  translations?: Record<string, Record<string, string>>;
  [other: string]: unknown;
};

export type ThemeOverrides = Omit<Partial<Theme>, "colors"> & { colors?: Partial<Theme["colors"]> };
export type ThemeBackground = {
  kind: "solid" | "gradient" | "image" | "video"; value: string; overlayOpacity?: number; blur?: number;
  vignette?: number; fit?: "cover" | "contain"; position?: "center" | "top" | "bottom" | "left" | "right"; imageOpacity?: number;
  /** Soft radial glow over any background: colour, centre and radius in % of the page, opacity. */
  glow?: { color: string; x?: number; y?: number; size?: number; opacity?: number };
};
/** Decorative art anchored to a corner or edge. Transparent png and svg keep their aspect ratio. */
export type ThemeArt = { url: string; placement?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "left" | "right" | "top" | "bottom"; size?: number; sizeUnit?: "%" | "px"; opacity?: number; repeat?: boolean; front?: boolean };
export type Theme = {
  colors: { primary: string; background: string; text: string; secondary?: string; muted?: string; error?: string; buttonText?: string; fieldBackground?: string; border?: string; heading?: string };
  font?: string; headingFont?: string; fontSize?: "sm" | "md" | "lg"; radius?: number; spacing?: "compact" | "normal" | "relaxed";
  buttonStyle?: "solid" | "outline" | "pill"; fieldStyle?: "outline" | "filled" | "underline";
  logoUrl?: string; backgroundImageUrl?: string; transition?: "none" | "fade" | "slide"; colorScheme?: "light" | "dark" | "auto"; customCss?: string;
  background?: ThemeBackground; alignment?: "left" | "center";
  /** xs is the doc scale (16-20px titles). */
  questionSize?: "xs" | "sm" | "md" | "lg" | "xl"; answerColor?: string;
  fontSource?: "system" | "google"; logoPlacement?: "top_left" | "top_center" | "top_right" | "none"; defaultMediaLayout?: MediaLayout;
  /** Self-hosted faces (https or /api/media urls). Reference the family in `font` / `headingFont`. */
  customFonts?: { family: string; url: string; weight?: number; style?: "normal" | "italic" }[];
  logoSize?: number; headingWeight?: number;
  /** Exact numeric design tokens that beat the presets: titleSize, answerSize, gapChoices, buttonRadius... (px unless noted). `mobile` repeats the size, gap, padding and height tokens for phones. */
  tokens?: {
    [token: string]: number | string | Record<string, number> | undefined;
    buttonTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
    labelTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
    contentAlign?: "top" | "center" | "bottom";
    buttonShadow?: "none" | "sm" | "md" | "lg";
    imageChoiceAspect?: "square" | "portrait" | "landscape" | "wide" | "auto";
    progressPosition?: "top" | "bottom";
    statementGlyphPosition?: "top" | "gutter";
    /** Colour tokens: cover, question, section and ending title colours; selected row fill and text. */
    coverTitleColor?: string; questionTitleColor?: string; sectionTitleColor?: string; endingTitleColor?: string; choiceSelectedBg?: string; choiceSelectedText?: string;
    mobile?: Record<string, number>;
  };
  /** Each falls back to `radius`. */
  radii?: { button?: number; choice?: number; media?: number; card?: number };
  surface?: { kind: "none" | "screen" | "section" | "field"; shadow?: "none" | "sm" | "md" | "lg"; color?: string };
  /** tile = translucent page-colour tile with a 1px outline. */
  choiceStyle?: "outline" | "raised" | "solid" | "radio" | "tile";
  /** Default row layout of every choice field; a field's own choiceLayout wins. */
  choiceLayout?: "hug" | "full" | "grid";
  /** Up to 3 decorative layers behind the questions. */
  art?: ThemeArt[];
  nav?: { style?: "arrows" | "chevrons" | "text" | "hidden"; position?: "right" | "left" | "center" };
  progress?: { style?: "bar" | "segmented" | "hairline" | "none"; thickness?: number; color?: string; track?: string; segments?: "section" | "stage" | "step"; count?: number };
  numberStyle?: "arrow" | "badge" | "none";
  numberBadge?: { shape?: "square" | "rounded" | "circle"; color?: string };
  subMarker?: "box" | "letter";
  buttonIcon?: "check" | "arrow" | "none";
  choiceSelected?: "tint" | "solid";
  motion?: "none" | "subtle" | "lively";
  requiredStyle?: "asterisk" | "text" | "none";
  statementStyle?: "quote" | "rule" | "plain" | "glyph";
  errorStyle?: "inline" | "strip" | "toast";
  buttonWidth?: "auto" | "full";
};

export type FormDefinition = {
  schemaVersion?: 1;
  title: string;
  description?: string;
  fields: FieldDefinition[];
  sections?: Section[];
  logic?: LogicRule[];
  variables?: { id: string; type: "number" | "text" | "boolean"; initial?: number | string | boolean }[];
  /** Typed, read-only respondent attributes from `attrs.<name>` or the profile lookup; pipe with {{attr.name|fallback}}. */
  attributes?: { name: string; type?: "text" | "number" | "boolean"; default?: string | number | boolean; label?: string }[];
  profileLookup?: { sourceId: string; map?: { from: string; to: string; as?: "attribute" | "field" }[]; timeoutMs?: number; cacheSeconds?: number };
  endings?: Ending[];
  welcome?: Welcome;
  scoring?: Scoring;
  leadScoring?: LeadScoring;
  settings?: FormSettings;
  theme?: ThemeOverrides;
};

export type DefinitionIssue = { severity: "error" | "warning"; code: string; message: string; path: string };

/** Option values used by individual fields and settings. */
export type NamePart = "prefix" | "first" | "middle" | "last" | "suffix";
export type NameLayout = "side" | "stacked";
export type AddressPart = "line1" | "line2" | "city" | "region" | "postal_code" | "country";
export type DateOrder = "dmy" | "mdy" | "ymd";
export type RatingIcon = "star" | "heart" | "thumb" | "circle" | "person" | "face";
export type FileUploadAppearance = "dropzone" | "pill";
export type ProductLayout = "cards" | "rows" | "list" | "grid";
export type PaymentProvider = "stripe" | "paypal";
export type PaymentMode = "payment" | "subscription";
export type HiddenSource = "url_param" | "static" | "respondent";
export type NotificationDocumentRecipient = "owner" | "respondent";
export type ConsentCategory = "analytics" | "marketing";
export type MetaPixelEvent = "Lead" | "CompleteRegistration" | "SubmitApplication" | "Contact";
export type CalculatedFormat = "number" | "currency" | "percent" | "text";
