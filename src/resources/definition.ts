/** Form definition types (mirror of the server model; keep in sync with openapi.json components.schemas). */
export type FieldType =
  | "short_text" | "long_text" | "email" | "phone" | "url" | "name" | "address" | "company" | "job_title" | "secret"
  | "integer" | "decimal" | "currency" | "percentage" | "number_range" | "date" | "time" | "datetime" | "duration"
  | "country" | "region" | "postal_code" | "timezone"
  | "single_choice" | "multiple_choice" | "dropdown" | "multi_select" | "image_choice" | "icon_choice" | "ranking" | "matrix" | "likert" | "yes_no" | "toggle"
  | "star_rating" | "rating" | "nps" | "emoji_rating" | "slider" | "csat" | "ces" | "opinion_scale"
  | "file_upload" | "product" | "quantity" | "coupon" | "payment" | "order_summary" | "donation"
  | "hidden" | "calculated" | "consent" | "legal" | "signature" | "appointment" | "location" | "barcode" | "statement" | "custom" | "ai_followup" | "repeating_group"
  | "divider" | "fill_blank" | "multi_text" | "color" | "contact" | "date_range" | "draw_image" | "click_map" | "maxdiff";

export type MediaLayout = "stack" | "split_left" | "split_right" | "wallpaper" | "float_left" | "float_right";
export type Media = {
  kind: "image" | "video"; url: string; alt?: string; layout?: MediaLayout; focalPoint?: { x: number; y: number }; crop?: { x: number; y: number; w: number; h: number }; aspect?: "1:1" | "4:3" | "3:2" | "16:9" | "21:9" | "3:4" | "2:3" | "9:16"; brightness?: number; autoplay?: boolean; clipStart?: number; clipEnd?: number; loop?: boolean; muted?: boolean; controls?: boolean;
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
  | { kind: "field" | "variable"; id: string; /** field only, product fields: compare the quantity ordered of this choice. */ quantityOf?: string } | { kind: "url_param"; name: string } | { kind: "respondent"; attribute: string } | { kind: "attribute"; name: string } | { kind: "now" }
  /** Running lead score; not usable inside leadScoring rules. */
  | { kind: "lead_score" }
  /** Quiz score of one scoring dimension. */
  | { kind: "score"; dimension: string };
export type SimpleCondition = { type: "condition"; source: ConditionSource; operator: ConditionOperator; value?: string | number | boolean | string[] | null };
export type Condition = SimpleCondition | { type: "group"; combinator: "and" | "or"; conditions: Condition[] };

export type Choice = {
  id: string; label: string; /** Product rows: a line under the name. */ description?: string; value?: string; imageUrl?: string; /** Shortcut letter on the badge. */ key?: string; icon?: string; points?: Record<string, number>; correct?: boolean; price?: string;
  variants?: { id: string; label: string; price?: string }[];
  /** Show "Free" for a zero price. */
  free?: boolean;
  /** Reaction line shown when this choice is selected. Supports piping. */
  response?: string;
  /** Hidden unless this holds (attributes, earlier answers). */
  visibleWhen?: Condition;
  /** Matrix rows: must be answered. */
  required?: boolean;
  /** Product choices: units available; orders beyond it are refused at submit. */
  stock?: number;
};

export type LogicAction =
  | { type: "show_field" | "hide_field" | "jump_to_field" | "require_field" | "disable_field" | "enable_field"; fieldId: string }
  /** The server computes the value and overrides what the client sent. */
  | { type: "set_value"; fieldId: string; expression: string }
  | { type: "show_section" | "hide_section" | "jump_to_section"; sectionId: string }
  | { type: "end_form"; endingId?: string } | { type: "redirect"; url: string }
  | { type: "set_variable"; variableId: string; expression: string } | { type: "set_message"; messageId: string; text: string }
  | { type: "select_ending"; endingId: string } | { type: "trigger_workflow"; workflowId: string }
  /** Applies an input mask to a short_text or phone field while the rule holds; the server enforces it. */
  | { type: "set_mask"; fieldId: string; mask: string }
  /** Hides the submit button while the rule holds. */
  | { type: "hide_submit" };
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
  /** Check the answer against a record data source (kind "record") on submit; no matching row shows `message`. */
  validateVia?: { sourceId: string; message?: string };
  /** ai_followup: the field whose answer triggers the question, and the author's limits. */
  afterFieldId?: string; intent?: string; tone?: string; maxQuestionLength?: number; answerTypes?: ("text" | "choice")[]; fallbackQuestion?: string; fallbackChoices?: string[];
  /** short_text and phone: 9 = digit, a = letter, * = either, other characters are literals, "\\" escapes. Example "(999) 999-9999". */
  mask?: string;
  /** email and phone: the respondent proves ownership with a one-time code before submitting. */
  verify?: boolean;
  quality?: { blockDisposable?: boolean; blockFree?: boolean; requireMx?: boolean };
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
  /** columns layout: across (default) or down (top to bottom per column) */
  fillOrder?: "across" | "down";
  hideKeys?: boolean;
  /** image_choice. tile = art on a padded tile with the label under it. */
  cardStyle?: "card" | "inset" | "art" | "tile";
  cardSize?: "sm" | "md" | "lg";
  imageAspect?: "square" | "portrait" | "landscape" | "auto";
  badgePlacement?: "top_left" | "top_right" | "bottom_left" | "bottom_right" | "inline" | "above";
  choices?: Choice[];
  randomize?: boolean; keepLetters?: boolean;
  /** multiple choice: drop the "choose as many" line */
  hideHint?: boolean;
  allowOther?: boolean;
  min?: number;
  max?: number;
  step?: number;
  /** date: segments (typed day, month, year) or selects (three dropdowns with captions). */
  entry?: "segments" | "selects";
  /** Hide the label visually; screen readers still read it. */
  hideLabel?: boolean;
  /** Owner-facing name in results and exports. */
  adminLabel?: string;
  /** Refuse an answer an earlier completed response already gave. */
  unique?: boolean; uniqueMessage?: string;
  /** Choice fields: sort by label; carry another field's picks (or non-picks) forward as this field's choices. */
  sort?: "alpha" | "alpha_desc"; carryFrom?: { fieldId: string; mode?: "selected" | "unselected" };
  /** long_text: formatting toolbar, stored as markdown. phone: extension box. integer and decimal: plus and minus buttons. */
  rich?: boolean; extension?: boolean; spinner?: boolean;
  /** date: separator between boxes, no weekends, blocked ISO dates, and day offsets from today (-7 = a week ago). time: min and max as HH:MM and a step in minutes. */
  separator?: "/" | "-" | "."; disableWeekends?: boolean; disabledDates?: string[]; minOffsetDays?: number; maxOffsetDays?: number; stepMinutes?: number;
  /** star_rating icon also accepts "number" and "custom" (with iconUrl). */
  iconUrl?: string;
  /** matrix: every row required, one pick per column, dropdown cells. Rows also take { required: true }. */
  requireAllRows?: boolean; uniquePerColumn?: boolean; cellType?: "radio" | "dropdown";
  /** appointment: bookings one slot takes. Product choices take { stock }. */
  slotCapacity?: number;
  /** Native scheduling: weekly hours, buffers and notice; see docs/parity/done-P5.md. */
  availability?: { timezone?: string; weekly: { day: number; start: string; end: string }[]; intervalMinutes?: number; bufferMinutes?: number; minNoticeHours?: number; maxDays?: number; emailFieldId?: string; busyConnectionId?: string };
  /** file_upload: open the camera on phones. */
  capture?: "user" | "environment";
  /** Choice fields: id of a shared option list that replaces `choices` when served (keep one placeholder choice). file_upload recordings: transcribe them; reuseConsentFieldId names the consent field that allows a public embed. */
  listId?: string; transcribe?: boolean; reuseConsentFieldId?: string;
  /** divider style; fill_blank blanks (the label holds ___); multi_text boxes; color palette; contact parts; date_range nights; draw_image and click_map picture. */
  style?: "line" | "dashed" | "space"; blanks?: { id: string; answer?: string; width?: number }[]; boxes?: { id: string; label: string }[]; requireAll?: boolean;
  palette?: string[]; allowCustom?: boolean; parts?: string[]; minNights?: number; maxNights?: number; imageUrl?: string; penColor?: string; maxClicks?: number;
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
  id: string; title: string; body?: string; redirectUrl?: string; ctaLabel?: string; ctaUrl?: string; when?: Condition; showScore?: boolean; allowDownload?: boolean; media?: Media; share?: boolean; confetti?: boolean;
  /** Chained ending: a continue button leads here. */
  nextEndingId?: string;
  fillAgain?: boolean;
  recap?: boolean;
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
  /** pager = the floating pager starts the form instead of a button. */
  startControl?: "button" | "pager";
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
  | { kind: "banner"; text: string; linkLabel?: string; linkUrl?: string; tone?: "brand" | "info" | "success" | "warning" | "danger" | "dark"; align?: "left" | "center" }
  | { kind: "social"; heading?: string; links: { network: "x" | "linkedin" | "facebook" | "instagram" | "youtube" | "tiktok" | "github" | "website" | "email"; url: string; label?: string }[]; align?: "left" | "center" }
  | { kind: "embed"; title?: string; html: string; height?: number }
  | { kind: "oembed"; title?: string; url: string; height?: number }
);
export type EmailBlock =
  | { kind: "logo"; url: string; alt?: string; width?: number }
  | { kind: "heading" | "text"; text: string }
  | { kind: "answers"; title?: string }
  | { kind: "button"; label: string; url: string }
  | { kind: "divider" };
export type EmailDesign = { accent?: string; background?: string; preheader?: string; blocks: EmailBlock[] };
export type PresentationMode = "standard" | "multi_step" | "conversational" | "chat" | "landing" | "assessment";

/** `settings.externalStorage`: delete our copy of an upload once a copy-to-storage step has delivered it. */
export type ExternalStorageSettings = { enabled: boolean };
export type NotificationSettings = {
  ownerEmails?: string[];
  /** Owner alert is sent as an encrypted attachment (RSA-OAEP wrapped AES-GCM key). */
  encryptOwnerEmail?: { publicKeyJwk: { kty: "RSA"; n: string; e: string }; keyId?: string };
  /** E.164 numbers texted a link on each new response (SMS / WhatsApp via Twilio). */
  ownerSms?: string[]; ownerWhatsapp?: string[];
  respondentReceipt?: { emailFieldId: string; subject: string; body: string; includeAnswers?: boolean };
  /** Attach the PDF of the response to the owner alert and/or receipt. */
  attachDocument?: { to: ("owner" | "respondent")[]; templateId?: string };
  /** Attach uploaded files under maxMb (default 5), else 7 day signed links. */
  attachUploads?: { to: ("owner" | "respondent")[]; maxMb?: number };
  /** Block-built HTML emails replacing the plain owner alert and the respondent receipt body. */
  emailDesign?: { owner?: EmailDesign; respondent?: EmailDesign };
  /** Extra emails sent only when a rule matches; recipients and text may come from answers. */
  rules?: { id: string; name?: string; when: Condition; to?: string[]; toFieldIds?: string[]; subject?: string; body?: string; includeAnswers?: boolean }[];
};
export type FormSettings = {
  presentation?: PresentationMode;
  showProgress?: boolean; allowBack?: boolean; reviewBeforeSubmit?: boolean; allowResume?: boolean; savePartials?: boolean; abandonReminder?: { enabled?: boolean; afterHours?: number; emailFieldId?: string };
  /** ISO date-time. The form shows a "not open yet" state until then. */
  openAt?: string;
  closeAt?: string; maxResponses?: number; oneResponsePerRespondent?: boolean;
  /** Shown instead of the form once it is closed. */
  closedMessage?: string;
  /** Repeat-response prevention: cookie, ip, email (first email field) or field (duplicateField). */
  duplicatePrevention?: "none" | "cookie" | "ip" | "email" | "field"; duplicateField?: string;
  /** Seconds allowed once the form starts; auto-submits at zero. */
  timeLimitSeconds?: number;
  /** Shuffle the order of sections. */
  randomizeSections?: boolean;
  /** Sticky list of section titles on long page forms. */
  toc?: { enabled?: boolean; title?: string };
  /** A short message once progress passes each percent. */
  milestones?: { percent: number; message: string }[];
  /** Order total on the submit button. */
  submitShowsTotal?: boolean;
  /** Fill answers from an earlier submission (this or another form). `fields` maps source field id to this form's field id. */
  prefillFromPrevious?: { enabled?: boolean; formId?: string; matchOn: "uid" | "email" | "hidden"; keyFieldId?: string; param?: string; fields: Record<string, string>; maxAgeDays?: number };
  /** Assessment integrity: tab switches are stored on the response; lock or auto-submit after maxSwitches. */
  lockedQuiz?: { enabled?: boolean; maxSwitches?: number; action?: "log" | "lock" | "submit"; message?: string };
  requireIdentity?: boolean; randomizeFieldOrder?: boolean;
  locale?: string; noTranslate?: boolean; anonymous?: boolean; resultsSummary?: boolean; submitLabel?: string; captcha?: boolean; honeypot?: boolean;
  showQuestionNumbers?: boolean; showTimeToComplete?: boolean; autoAdvance?: boolean;
  /** false hides the "Made with FormFlow" badge; needs a plan that includes removeBranding, otherwise ignored. */
  branding?: boolean;
  /** Completions faster than this many ms are filed as spam. */
  minCompletionMs?: number;
  quotas?: { id: string; when: Condition; limit: number }[];
  landing?: { heading: string; body?: string; heroImageUrl?: string };
  navStyle?: "chevrons" | "pager" | "link" | "arrow" | "none"; pagerMobile?: "pager" | "button";
  showTitle?: boolean; showStepLabel?: boolean; showEnterHint?: boolean; showOkIcon?: boolean;
  nextLabel?: string; timeHint?: string; confirmAnswers?: boolean; swipeNavigation?: boolean;
  brandPosition?: "left" | "center" | "right" | "corner"; brandStyle?: "badge" | "chip" | "pill" | "text";
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
  /** Answers of these fields are encrypted in the browser with the public key; the private key never reaches the server. */
  encryption?: { publicKeyJwk: { kty: "RSA"; n: string; e: string }; keyId: string; fieldIds: string[] };
  /** Onboarding: resume by uid, signed identity and opt-in AI. */
  personalization?: { resumeByUid?: boolean; resumeTtlHours?: number; requireSignedUid?: boolean; ai?: { enabled?: boolean; maxFollowUps?: number; consentFieldId?: string } };
  /** Analytics and ad pixels (gtm, ga4, metaPixel, googleAds, linkedin, tiktok with submitEvent "SubmitForm" | "CompleteRegistration" | "Contact"); shape is documented in /developers/form-builder. */
  tracking?: Record<string, unknown>;
  externalStorage?: ExternalStorageSettings;
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
  surface?: { kind: "none" | "screen" | "section" | "field"; shadow?: "none" | "sm" | "md" | "lg"; color?: string; /** title and description in their own card */ titleCard?: boolean; /** px band in the primary colour along the top of the title card */ accentBorder?: number };
  /** tile = translucent page-colour tile with a 1px outline. */
  choiceStyle?: "outline" | "raised" | "solid" | "radio" | "tile" | "plain";
  /** Default row layout of every choice field; a field's own choiceLayout wins. */
  choiceLayout?: "hug" | "full" | "grid";
  /** Up to 3 decorative layers behind the questions. */
  art?: ThemeArt[];
  nav?: { style?: "arrows" | "chevrons" | "text" | "hidden"; position?: "right" | "left" | "center" };
  progress?: { style?: "bar" | "segmented" | "hairline" | "answered" | "none"; thickness?: number; color?: string; track?: string; segments?: "section" | "stage" | "step"; count?: number };
  numberStyle?: "arrow" | "badge" | "none";
  numberBadge?: { shape?: "square" | "rounded" | "circle"; color?: string };
  subMarker?: "box" | "letter";
  buttonIcon?: "check" | "arrow" | "none";
  choiceSelected?: "tint" | "solid";
  motion?: "none" | "subtle" | "lively";
  /** Page layouts: questions other than the one being answered fade back. */
  focusDim?: boolean;
  /** Captions of multi-part inputs: above (default) or below. */
  subLabels?: "above" | "below";
  requiredStyle?: "asterisk" | "dot" | "text" | "none";
  statementStyle?: "quote" | "rule" | "plain" | "glyph";
  errorStyle?: "inline" | "strip" | "band" | "toast";
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
export type PaymentProvider = "stripe" | "paypal" | "square" | "mollie" | "braintree" | "authorizenet";
export type PaymentMode = "payment" | "subscription";
export type HiddenSource = "url_param" | "static" | "respondent" | "geo";
export type NotificationDocumentRecipient = "owner" | "respondent";
export type ConsentCategory = "analytics" | "marketing";
export type MetaPixelEvent = "Lead" | "CompleteRegistration" | "SubmitApplication" | "Contact";
export type CalculatedFormat = "number" | "currency" | "percent" | "text";
