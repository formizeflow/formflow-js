/** Form definition types (mirror of the server model; keep in sync with openapi.json components.schemas). */
export type FieldType =
  | "short_text" | "long_text" | "email" | "phone" | "url" | "name" | "address" | "company" | "job_title" | "secret"
  | "integer" | "decimal" | "currency" | "percentage" | "number_range" | "date" | "time" | "datetime" | "duration"
  | "country" | "region" | "postal_code" | "timezone"
  | "single_choice" | "multiple_choice" | "dropdown" | "multi_select" | "image_choice" | "icon_choice" | "ranking" | "matrix" | "likert" | "yes_no" | "toggle"
  | "star_rating" | "rating" | "nps" | "emoji_rating" | "slider" | "csat" | "ces" | "opinion_scale"
  | "file_upload" | "product" | "quantity" | "coupon" | "payment" | "order_summary" | "donation"
  | "hidden" | "calculated" | "consent" | "legal" | "signature" | "appointment" | "location" | "barcode" | "statement" | "custom" | "ai_followup" | "ai_interview" | "repeating_group"
  | "divider" | "fill_blank" | "multi_text" | "color" | "contact" | "date_range" | "draw_image" | "click_map" | "maxdiff" | "id_check" | "person";

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
export type SimpleCondition = { type: "condition"; source: ConditionSource; operator: ConditionOperator; value?: string | number | boolean | string[] | null; /** Compare to another field or variable instead of `value`. */ valueFrom?: ConditionSource };
export type Condition = SimpleCondition | { type: "group"; combinator: "and" | "or"; conditions: Condition[] };

export type Choice = {
  id: string; label: string; /** px width of this option, for rows of uneven options. */ width?: number; /** Keep the label on one line. */ noWrap?: boolean; /** Grid columns this option spans. */ span?: number; /** px space before this option (above in a list, left in a row). */ marginTop?: number; marginLeft?: number; /** px height of this option or matrix row. */ height?: number; /** Product rows: a line under the name. */ description?: string; value?: string; imageUrl?: string; /** Shortcut letter on the badge. */ key?: string; icon?: string; points?: Record<string, number>; correct?: boolean; price?: string;
  variants?: { id: string; label: string; price?: string }[];
  /** Product with several option axes (Color and Size), up to 4 groups of 20 choices. Ignored when `variants` is set. Orders carry one choice per group. */
  optionGroups?: { id: string; label: string; choices: { id: string; label: string; /** Added to the unit price. */ priceDelta?: string }[] }[];
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
  /** Canvas layout: top-left corner of the card on the board, px 0-10000; absent = automatic placement. */
  canvas?: { x: number; y: number };
  /** Column span in page layouts (12-column grid: half 6, third 4, quarter 3, two-thirds 8, three-quarters 9); adjacent fields share a row. */
  width?: "full" | "half" | "third" | "quarter" | "two-thirds" | "three-quarters";
  /** Style of this field only: parts inside a field (fieldCard, questionTitle, questionDescription, number, required, input, select, choice, choiceSelected, choiceIndicator, choices, scaleCell, scaleCellSelected, error, divider, image). */
  /** Divider fields also accept "line" | "dashed" | "space" here for the line look. */
  style?: PartStyles | "line" | "dashed" | "space";
  /** Text inputs: placeholders cycled while empty and unfocused (max 10). */
  placeholders?: string[];
  /** Plain-language twin of label and helpText, shown when the respondent turns on simple wording (settings.comfort). */
  simple?: { label?: string; helpText?: string };
  /** A 0-100 "how sure are you" slider under the answer; stored as the answer key "<fieldId>.confidence" (integer 0-100). End labels max 40 characters. */
  confidence?: { label?: string; min?: string; max?: string };
  /** Page layouts: the field stays in view while the rest scrolls. Ignored in one-question layouts. */
  sticky?: boolean;
  /** short_text: entry "comb" draws one box per character (combCount 2-24, default 6; the answer is one string); fit "answer" sizes the box to the longest allowed answer (max_length or combCount) plus 2ch. */
  combCount?: number; fit?: "answer";
  /** location: mode "map_pin" shows a tile map (click, drag the pin, arrow keys, address search); the answer is { lat, lng, address? }. tileUrl needs {z}, {x}, {y} and https. */
  mode?: "gps" | "map_pin";
  map?: { center?: { lat: number; lng: number }; zoom?: number; tileUrl?: string; searchUrl?: string; search?: boolean; attribution?: string };
  /** long_text: lined paper; color is a #rrggbb hex, lineHeight 16-60 px. */
  ruled?: { color?: string; lineHeight?: number };
  /** Leading icon in single-line text inputs: lucide icon name in kebab-case. */
  icon?: string;
  /** Skip the question when prefill, the named attribute (default: the field id) or the profile lookup already gives a value; it is recorded with source "profile". */
  skipIfKnown?: boolean | { attribute?: string };
  /** Classify the open-text answer into one of these categories with AI; the category id is stored in the variable `variableId`. */
  classify?: { variableId: string; categories: { id: string; label: string; hint?: string }[]; fallbackCategory?: string; minConfidence?: number };
  /** Rewrite this field's label for the respondent with AI, within these limits. */
  personalize?: { enabled?: boolean; maxLength?: number; guidance?: string };
  /** Fetch on change: calls an API data source (kind "api") on blur or after a pause and fills other fields from the answer. Respondent edits are kept unless overwrite is set. */
  lookup?: { sourceId: string; trigger?: "blur" | "debounce"; minLength?: number; fill: { fieldId: string; path: string; overwrite?: boolean }[] };
  /** Check the answer against a record data source (kind "record") on submit; no matching row shows `message`. */
  validateVia?: { sourceId: string; message?: string };
  /** ai_interview: goals (1-8), maxTurns (1-12, default 5), tone, must-ask probes (also the only questions when AI is off) and allowSkip (default true). The answer is { transcript: [{ role: "ai" | "you", text }], summary, keyPoints, ended }. */
  goals?: string[]; maxTurns?: number; probes?: string[]; allowSkip?: boolean;
  /** id_check: identity (Stripe Identity) or bank (Plaid Link); the answer is "verified" once the server confirmed it. countries: Plaid country codes (default US). */
  check?: "identity" | "bank"; countries?: string[];
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
  /** packed: each column stacks on its own; an option spanning every column starts a new band. */ fillOrder?: "across" | "down" | "packed";
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
  /** date: segments (typed day, month, year), selects (three dropdowns with captions) or native (the browser's own date input). */
  /** single = one typed box with the calendar button inside (part datePick). */
  /** short_text also takes "comb" (one box per character). */
  entry?: "segments" | "selects" | "native" | "single" | "calendar" | "comb";
  /** calendar = an always-visible month grid (parts calendar, calendarDay, calendarNav); weekStart is its first weekday (default sunday). */
  weekStart?: "monday" | "sunday";
  /** single_choice, multiple_choice with one option: put the required marker after the option's label instead of the question's. */
  markOn?: "label" | "option";
  /** rating, nps, ces, opinion_scale: joined = one strip of boxed cells sharing borders (default separate). */
  scaleStyle?: "separate" | "joined";
  /** rating, nps, ces, opinion_scale: end labels below (default) or above the row. */
  labelsPosition?: "below" | "above";
  /** product: checkbox in the photo corner selects the product (quantity 1). */
  selectControl?: "checkbox";
  /** product with withQuantity: stepper (default) or select (0 to quantityMax). */
  quantityEntry?: "stepper" | "select";
  quantityMax?: number;
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
  /** Top-left header text; a last column of written notes per row, saved as "note:<row id>". */
  cornerLabel?: string; noteColumn?: { label: string; placeholder?: string };
  /** appointment: bookings one slot takes. Product choices take { stock }. */
  slotCapacity?: number;
  /** Native scheduling: weekly hours, buffers and notice; see docs/parity/done-P5.md. */
  availability?: { timezone?: string; weekly: { day: number; start: string; end: string }[]; intervalMinutes?: number; bufferMinutes?: number; minNoticeHours?: number; maxDays?: number; emailFieldId?: string; busyConnectionId?: string };
  /** file_upload: open the camera on phones. */
  capture?: "user" | "environment";
  /** Choice fields: id of a shared option list that replaces `choices` when served (keep one placeholder choice). file_upload recordings: transcribe them; reuseConsentFieldId names the consent field that allows a public embed. */
  /** file_upload: scan to fill. The respondent photographs an ID, business card or receipt and the workspace AI vision provider proposes values for the mapped questions; the respondent confirms before they fill; the photo is not kept; hidden without an AI provider. */
  scan?: { kind: "id" | "business_card" | "receipt" | "document"; map: { fieldId: string; extract: string }[] };
  listId?: string; transcribe?: boolean; reuseConsentFieldId?: string;
  /** divider style; fill_blank blanks (the label holds ___); multi_text boxes; color palette; contact parts; date_range nights; draw_image and click_map picture. */
  blanks?: { id: string; answer?: string; width?: number; /** a short line under the blank ("First Name"); part blankCaption */ caption?: string; /** a pick-one blank: a select of these options inside the sentence */ options?: string[]; placeholder?: string; /** px width of this blank */ boxWidth?: number; /** extra px before this blank */ marginLeft?: number }[]; boxes?: { id: string; label: string }[]; requireAll?: boolean;
  palette?: string[]; allowCustom?: boolean; parts?: string[]; minNights?: number; maxNights?: number; imageUrl?: string; penColor?: string; maxClicks?: number;
  /** person: where people come from ("members" or "table"), the table and the column shown as the name. */
  source?: "members" | "table"; tableId?: string; labelColumn?: string;
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
  /** Page layouts: the section's fields inside one card. */
  card?: boolean;
  /** Page layouts: equal columns (1-4) for fields without their own width. */
  columns?: number;
  /** Page layouts: text alignment of the section. */
  align?: "left" | "center" | "right";
  /** Style of this section only: card, sectionTitle, sectionDescription plus every field part. */
  style?: PartStyles;
};

/** One value of a part style. Numbers are px unless noted; colours are hex, rgb(), hsl() or a keyword. */
export type PartShadowItem = { x: number; y: number; blur: number; spread?: number; color: string; inset?: boolean };
/** A preset, one structured shadow, or up to 4. */
export type PartShadow = "none" | "sm" | "md" | "lg" | "xl" | PartShadowItem | PartShadowItem[];
export type PartBorderStyle = "solid" | "dashed" | "dotted" | "double" | "groove" | "ridge" | "inset" | "outset" | "none";
export type PartBackgroundImage = {
  /** https url, an app path starting with "/", or a base64 data:image. */
  url: string; size?: "cover" | "contain" | "auto" | number;
  position?: "center" | "top" | "bottom" | "left" | "right" | "top-left" | "top-right" | "bottom-left" | "bottom-right";
  repeat?: "no-repeat" | "repeat" | "repeat-x" | "repeat-y";
};
export type PartStyleBase = {
  color?: string; background?: string;
  /** Up to 3 plain gradients (repeating ones too), first on top. */
  backgroundLayers?: string[]; backgroundImage?: PartBackgroundImage;
  /** Gradient text; fallback is the solid colour. */
  textFill?: { gradient: string; fallback?: string };
  borderStyle?: PartBorderStyle; borderTopStyle?: PartBorderStyle; borderRightStyle?: PartBorderStyle; borderBottomStyle?: PartBorderStyle; borderLeftStyle?: PartBorderStyle;
  borderWidth?: number; borderTopWidth?: number; borderRightWidth?: number; borderBottomWidth?: number; borderLeftWidth?: number;
  borderColor?: string; borderTopColor?: string; borderRightColor?: string; borderBottomColor?: string; borderLeftColor?: string;
  outlineWidth?: number; outlineStyle?: "solid" | "dashed" | "dotted" | "double" | "none"; outlineColor?: string; outlineOffset?: number;
  /** px 0-999, or a percentage string "0%" to "50%". */
  radius?: number | string; radiusTopLeft?: number | string; radiusTopRight?: number | string; radiusBottomRight?: number | string; radiusBottomLeft?: number | string;
  paddingX?: number; paddingY?: number; paddingTop?: number; paddingRight?: number; paddingBottom?: number; paddingLeft?: number;
  /** -1000 to 1000. */
  marginTop?: number; marginBottom?: number; marginLeft?: number; marginRight?: number;
  /** px number or a percentage string such as "50%". */
  width?: number | string; maxWidth?: number | string; minWidth?: number | string; height?: number | string; maxHeight?: number | string; minHeight?: number; gap?: number; rowGap?: number; columnGap?: number;
  aspectRatio?: number | "auto" | "1/1" | "4/3" | "3/2" | "16/9" | "21/9" | "3/4" | "2/3" | "9/16";
  /** image part only */
  objectFit?: "cover" | "contain" | "fill";
  display?: "block" | "inline-block" | "flex" | "none";
  /** container parts: stage, screen, card, header, fieldCard, choice */
  flexDirection?: "row" | "column" | "row-reverse" | "column-reverse"; alignItems?: "start" | "center" | "end" | "stretch"; alignSelf?: "start" | "center" | "end" | "stretch"; justifyContent?: "start" | "center" | "end" | "between" | "around" | "evenly";
  fontFamily?: string; fontSize?: number; fontWeight?: number; fontStyle?: "normal" | "italic" | "oblique"; fontVariant?: "normal" | "small-caps";
  /** Variable font axes -> font-variation-settings: wght 100-1000, wdth 25-200, opsz 6-144, slnt -20-0. Allowed inside `when` and `at`. */
  fontVariation?: { wght?: number; wdth?: number; opsz?: number; slnt?: number };
  letterSpacing?: number; wordSpacing?: number;
  /** ratio 0-3, or a px string such as "24px". */
  lineHeight?: number | string;
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize"; textAlign?: "left" | "center" | "right" | "justify";
  textDecoration?: "none" | "underline" | "line-through" | "overline"; textDecorationColor?: string; textDecorationThickness?: number; textUnderlineOffset?: number;
  whiteSpace?: "normal" | "nowrap"; textOverflow?: "clip" | "ellipsis";
  /** up to 2 */
  textShadow?: { x: number; y: number; blur: number; color: string }[];
  shadow?: PartShadow; opacity?: number;
  backdropBlur?: number; blur?: number; brightness?: number; grayscale?: number;
  transform?: { rotate?: number; scale?: number; translateX?: number; translateY?: number; skewX?: number };
  transition?: { duration?: number; easing?: "ease" | "linear" | "ease-in" | "ease-out" | "ease-in-out" };
  mixBlendMode?: "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten";
};
/** Colour, border, outline, shadow, transform and opacity: what hover, active and disabled (and focus) may change. */
export type PartStyleState = Pick<PartStyleBase, "color" | "background" | "borderColor" | "borderTopColor" | "borderRightColor" | "borderBottomColor" | "borderLeftColor" | "borderWidth" | "outlineColor" | "outlineWidth" | "outlineStyle" | "outlineOffset" | "shadow" | "textShadow" | "transform" | "opacity" | "brightness" | "textDecoration" | "textDecorationColor">;
/** A part style without `when` or `at`. */
export type PartStyleInner = PartStyleBase & {
  hover?: PartStyleState;
  focus?: PartStyleState & { ringColor?: string; ringWidth?: number };
  /** Pressed (:active). */
  active?: PartStyleState;
  /** :disabled or aria-disabled. */
  disabled?: PartStyleState;
  /** Phones (560px and below): the same properties. */
  mobile?: PartStyleBase;
};
/** A container breakpoint: `style` applies while the form column is at least `min` and at most `max` px wide (200-2000; one bound is enough). */
export type PartStyleAt = { min?: number; max?: number; style: PartStyleInner };
export type PartStyleWhen = "focused" | "filled" | "empty" | "invalid" | "prefilled" | "locked";
export type PartStyle = PartStyleInner & {
  /** Field states: the style applies inside a field in that state (focus within, has an answer, no answer, has an error, still holds a prefilled value, frozen or read only). */
  when?: { [K in PartStyleWhen]?: PartStyleInner & { at?: PartStyleAt[] } };
  /** Up to 4 container breakpoints, measured against the form column. A part that is the column itself (stage) cannot use them. */
  at?: PartStyleAt[];
};
export type PartName =
  | "page" | "stage" | "screen" | "card" | "fieldCard" | "header" | "title" | "description" | "sectionTitle" | "sectionDescription" | "questionTitle" | "questionDescription"
  | "number" | "required" | "input" | "placeholder" | "select" | "choice" | "choiceSelected" | "choiceLabel" | "choiceIndicator" | "choices" | "matrix" | "matrixColumnLabel" | "matrixRowLabel" | "matrixCell" | "matrixMark" | "scaleCell" | "scaleCellSelected" | "link" | "badge" | "button" | "buttonSecondary" | "actionButton"
  | "progress" | "progressTrack" | "error" | "endingTitle" | "endingDescription" | "siteHeader" | "siteFooter" | "brand" | "logo" | "divider" | "image"
  | "region" | "regionItem" | "siteCaret" | "calendar" | "calendarDay" | "calendarNav"
  | "hero" | "matrixCorner" | "matrixNote" | "siteLogo" | "siteLink" | "siteAction" | "datePick" | "actionsNote" | "pin" | "nav" | "navButton" | "blankCaption" | "comb";
export type PartStyles = { [K in PartName]?: PartStyle };
export type SiteBar = {
  logoUrl?: string; logoAlt?: string; text?: string;
  /** items = a submenu: a caret button opens a dropdown of links (part siteCaret). */
  links?: { label: string; url: string; style?: "underline" | "plain" | "button" | "outline"; items?: { label: string; url: string }[] }[];
  align?: "left" | "center" | "right"; position?: "static" | "sticky" | "fixed"; height?: number;
  /** Where the link group sits: after the logo, centred, or at the end. */
  linksAlign?: "start" | "center" | "end";
  /** Up to three buttons at the end of the bar (parts siteAction, siteLink, siteLogo). */
  actions?: { label: string; url: string; style?: "button" | "outline" | "link" }[];
};
export type Ending = {
  id: string; title: string; body?: string; redirectUrl?: string; redirectDelaySec?: number; ctaLabel?: string; ctaUrl?: string; ctaRoute?: string; ctaTarget?: "top" | "blank" | "self"; when?: Condition; showScore?: boolean; allowDownload?: boolean; media?: Media; share?: boolean; confetti?: boolean;
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
  | { kind: "banner"; text: string; linkLabel?: string; linkUrl?: string; tone?: "brand" | "info" | "success" | "warning" | "danger" | "dark"; align?: "left" | "center"; sticky?: boolean }
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
export type PresentationMode = "standard" | "multi_step" | "conversational" | "chat" | "landing" | "assessment" | "canvas";

/** `settings.externalStorage`: delete our copy of an upload once a copy-to-storage step has delivered it. */
export type ExternalStorageSettings = { enabled: boolean };
export type NotificationSettings = {
  ownerEmails?: string[];
  /** Owner alert is sent as an encrypted attachment (RSA-OAEP wrapped AES-GCM key). */
  encryptOwnerEmail?: { publicKeyJwk?: { kty: "RSA"; n: string; e: string }; pgp?: { publicKeyArmored: string }; keyId?: string };
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
  showProgress?: boolean; allowBack?: boolean; reviewBeforeSubmit?: boolean; allowResume?: boolean; /** "* Indicates required question" under the title, plus a progress-saved note when allowResume is on. */ requiredLegend?: boolean; savePartials?: boolean; abandonReminder?: { enabled?: boolean; afterHours?: number; emailFieldId?: string };
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
  showQuestionNumbers?: boolean; showTimeToComplete?: boolean; autoAdvance?: boolean; hotkeys?: boolean;
  /** Question number format (1. | 1) | 1 | Q1 | Q1. | (1) | A. | a) | i.), first number (0-9999) and position (inline, above the title, or hung in the left margin). */
  numbering?: { format?: "1." | "1)" | "1" | "Q1" | "Q1." | "(1)" | "A." | "a)" | "i."; start?: number; position?: "inline" | "above" | "gutter" };
  /** Required marker: text (max 40, default "*"), position, and whether it marks the required or the optional fields (default text "(optional)"). */
  requiredMarker?: { text?: string; position?: "after" | "before" | "end" | "below" | "corner"; mark?: "required" | "optional" };
  /** Back button and up to 4 extra buttons (link opens an http(s) url, reset clears the answers after a confirm, print opens the print dialog) in the actions row. */
  actions?: {
    back?: { label?: string; style?: "ghost" | "outline" | "link" | "icon" };
    extra?: { id: string; label: string; kind: "link" | "reset" | "print"; url?: string; style?: "primary" | "ghost" | "outline" | "link"; /** this button's own part style, over actionButton */ partStyle?: PartStyle }[];
    layout?: "row" | "split" | "stack"; order?: "back-first" | "primary-first";
  };
  /** Where the chevron / arrow navigation controls sit (inline = in the actions row) and their icon. */
  navPosition?: "bottom-right" | "bottom-center" | "bottom-left" | "top-right" | "top-left" | "inline"; navIcon?: "chevron" | "arrow" | "caret";
  /** Where the active question lands when it changes: its top at this fraction (0.1-0.9) of the viewport height. Smooth unless reduced motion. */
  anchorLine?: number;
  /** Page layouts: the corner up/down pair that moves to the previous or next question. */
  questionNav?: boolean;
  /** Comfort panel: a button opens toggles for what you offer (text-size, readable-font, contrast, reduce-motion, read-aloud, simple-wording; 1-6, unique). Remembered per form in the browser. */
  comfort?: { offer: ("text-size" | "readable-font" | "contrast" | "reduce-motion" | "read-aloud" | "simple-wording")[]; position?: "bottom-left" | "bottom-right" | "top-left" | "top-right" };
  /** Chips of the answered questions that jump back to them: along the top or down the side (collapsed on phones). */
  answerTrail?: "top" | "side";
  /** Co-fill: a "Fill together" button gives an invite link (in the URL fragment); 2 to 5 people (default 2) fill one response live, each with a colour and a field outline. Sensitive and encrypted fields are never shared. Any of them can submit, once. */
  coFill?: { enabled: boolean; maxPeople?: number };
  /** Each response adds or updates a workspace table row; map is column id to field id ("$id" = response id). */
  tableWrite?: { tableId: string; mode?: "append" | "upsert"; keyColumn?: string; map: Record<string, string> };
  /** Collect over SMS and/or WhatsApp, one question per message. */
  sms?: { enabled: boolean; channels?: ("sms" | "whatsapp")[]; expiryMinutes?: number; intro?: string };
  /** Saved logic test scenarios, re-run on publish; gate "block" stops publishing on a failure, "warn" reports it. */
  logicTests?: { gate?: "block" | "warn"; scenarios: { id: string; name: string; answers: Record<string, unknown>; expect: { ending?: string; visible?: string[]; hidden?: string[]; path?: string[] } }[] };
  /** Haptic buzz and a soft click on choosing and submitting; off under reduced motion and when the comfort panel turns motion off. */
  feedback?: { haptics?: boolean; sound?: boolean };
  /** The respondent can undo and restore earlier states of their answers (last 50, kept in memory). */
  history?: boolean;
  /** Free placement, the fallback: elements pinned on the page (they scroll) or the screen (fixed); x and y from the anchor corner, px. */
  pins?: {
    id: string; kind: "text" | "image" | "button" | "link" | "icon" | "box"; text?: string; url?: string;
    icon?: "chevron-up" | "chevron-down" | "chevron-left" | "chevron-right" | "arrow-up" | "arrow-down" | "arrow-left" | "arrow-right" | "close" | "menu" | "info" | "help" | "globe" | "search" | "home" | "check" | "plus" | "minus" | "external" | "calendar";
    action?: "next-question" | "previous-question" | "back" | "top" | "print"; label?: string;
    layer?: "page" | "screen"; anchor?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
    x: number; y: number; width?: number; height?: number; style?: Record<string, unknown>;
  }[];
  /** Structured places holding a flow of items: six anchored corners plus after-actions and before-title (parts region, regionItem). */
  regions?: Partial<Record<"top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right" | "after-actions" | "before-title", {
    items: {
      id: string; kind: "text" | "image" | "link" | "button" | "icon" | "badge" | "progress" | "toggle" | "glyph"; text?: string; url?: string; imageUrl?: string; iconSize?: number; imageAfter?: boolean; imageWidth?: number; justify?: "start" | "center" | "end";
      icon?: "chevron-up" | "chevron-down" | "chevron-left" | "chevron-right" | "arrow-up" | "arrow-down" | "arrow-left" | "arrow-right" | "close" | "menu" | "info" | "help" | "globe" | "search" | "home" | "check" | "plus" | "minus" | "external" | "calendar";
      action?: "next-question" | "previous-question" | "back" | "top" | "print" | "contrast"; label?: string; width?: number; height?: number; style?: Record<string, unknown>;
    }[];
    direction?: "row" | "column"; gap?: number; align?: "start" | "center" | "end" | "stretch"; x?: number; y?: number; layer?: "screen" | "page"; width?: number; full?: boolean;
  }>>;
  /** Relations instead of pixels: an item's edge follows an edge of a named element. item = a pin id or region item id; to = title|submit|progress|logo|card|stage|header|actions|field:<id>|field:<id>.label|field:<id>.input. Same-axis edges only; offset px -1000..1000. Needs CSS anchor positioning (other browsers keep the normal placement). */
  constraints?: { item: string; edge: "left" | "right" | "top" | "bottom" | "centerX" | "centerY"; to: string; toEdge: "left" | "right" | "top" | "bottom" | "centerX" | "centerY"; offset?: number }[];
  /** The page as one paragraph: {fieldId} placeholders become the field inline (input; select for dropdown and single_choice). Page layouts only; named fields are not drawn again. */
  sentenceMode?: { text: string };
  /** A line of text in the button row: after the buttons or below them (part actionsNote). */
  actionsNote?: { text: string; position?: "after" | "below" };
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
  sidePanel?: { mask?: "none" | "rounded" | "arch" | "circle"; url?: string; alt?: string; side?: "left" | "right"; ratio?: number; color?: string; fit?: "cover" | "contain"; mobile?: "banner" | "hide"; inset?: { top?: number; right?: number; bottom?: number; left?: number }; radius?: number };
  /** Bar above the form on every screen: logo, text, links. Style with theme.parts.siteHeader. */
  siteHeader?: SiteBar;
  /** Bar below the form on every screen. Style with theme.parts.siteFooter. */
  siteFooter?: SiteBar;
  header?: { kind?: "banner" | "illustration"; url: string; alt?: string; height?: number; align?: "left" | "center" };
  i18n?: { switcher?: boolean; autoDetect?: boolean; switcherPosition?: "top-right" | "top-left" | "header" | "footer" };
  offline?: { enabled: boolean; maxFileMb?: number };
  /** Shared-device mode: resets after submit and when idle. */
  kiosk?: { enabled: boolean; idleSeconds?: number; resetSeconds?: number };
  softCap?: { graceResponses?: number; warnAtPercent?: number };
  blocks?: PageBlock[];
  /** Signed link sent to the respondent to change answers later; every change is kept. */
  respondentEdit?: { enabled: boolean; expiresDays?: number };
  /** Answers of these fields are encrypted in the browser with the public key; the private key never reaches the server. */
  encryption?: { publicKeyJwk?: { kty: "RSA"; n: string; e: string }; pgp?: { publicKeyArmored: string; fingerprint: string }; keyId: string; fieldIds: string[] };
  /** Onboarding: resume by uid, signed identity and opt-in AI. */
  personalization?: { resumeByUid?: boolean; resumeTtlHours?: number; requireSignedUid?: boolean; ai?: { enabled?: boolean; maxFollowUps?: number; consentFieldId?: string } };
  /** Respondent AI assistant (web chat). Answers only from `knowledge` (text kept server-side; `sourceUrl` is a citation, never fetched); `canFill` lets it suggest field values the respondent confirms one by one; handoff mails the conversation to `email` (viaEmail) or links to `url`. */
  assistant?: { enabled?: boolean; title?: string; greeting?: string; tone?: string; knowledge?: { id: string; title: string; text: string; sourceUrl?: string }[]; canFill?: boolean; maxTurns?: number; handoff?: { viaEmail?: boolean; email?: string; url?: string; label?: string } };
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
  logoSize?: number; /** Logo pinned to its screen corner, out of the page flow. */ logoFixed?: boolean; headingWeight?: number;
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
  /** The colour moves from `from` to `to` (hex) as progress goes 0 to 100%: the page background or the accent colour (default). */
  progressTint?: { from: string; to: string; target?: "background" | "accent" };
  /** In the respondent's local time between darkFrom and darkTo ("HH:MM", may cross midnight) the form uses its dark palette. Needs no location. */
  schedule?: { darkFrom: string; darkTo: string };
  /** Animation when a question or page appears. title: fade, rise, type (revealed by characters) or none; choices and button: fade, rise or none. stagger 0-300 ms between choices, delay 0-1000 ms. Off under reduced motion or motion "none". */
  entrance?: { title?: "fade" | "rise" | "type" | "none"; choices?: "fade" | "rise" | "none"; button?: "fade" | "rise" | "none"; stagger?: number; delay?: number };
  /** Spacing by pace. auto watches the respondent's timing in the browser (nothing is sent): slow = roomier with help text at full size, quick = tighter. Overrides spacing. */
  density?: "auto" | "compact" | "comfortable";
  /** Page layouts: questions other than the one being answered fade back. */
  focusDim?: boolean;
  /** Captions of multi-part inputs: above (default) or below. */
  subLabels?: "above" | "below";
  requiredStyle?: "asterisk" | "dot" | "text" | "none";
  statementStyle?: "quote" | "rule" | "plain" | "glyph";
  errorStyle?: "inline" | "strip" | "band" | "toast";
  buttonWidth?: "auto" | "full";
  buttonAlign?: "start" | "center" | "end";
  /** Phones: the cover start button is pinned to the bottom edge at full width. */
  mobileButtonPin?: boolean;
  /** Per-part styles layered over presets and tokens: page, stage, screen, card, fieldCard, header, title, description, sectionTitle, questionTitle, input, choice, choiceSelected, button, progress, error... */
  parts?: PartStyles;
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
  /** Up to 20 rules: while `when` holds for the live answers, `theme` merges over the base theme; later rules win. */
  themeRules?: ThemeRule[];
  /** Up to 20 rules: the first whose `when` holds switches the form to `layout`; none = settings.presentation. */
  layoutRules?: { when: Condition; layout: PresentationMode }[];
};
/** The part of a theme a rule may change. */
export type ThemeRule = { when: Condition; theme: { colors?: ThemeOverrides["colors"]; background?: ThemeBackground; logoUrl?: string; buttonStyle?: "solid" | "outline" | "pill"; parts?: PartStyles } };

export type DefinitionIssue = { severity: "error" | "warning"; code: string; message: string; path: string };

/** Option values used by individual fields and settings. */
export type NamePart = "prefix" | "first" | "middle" | "last" | "suffix";
export type NameLayout = "side" | "stacked";
export type AddressPart = "line1" | "line2" | "city" | "region" | "postal_code" | "country";
export type DateOrder = "dmy" | "mdy" | "ymd";
export type RatingIcon = "star" | "heart" | "thumb" | "circle" | "person" | "face";
export type FileUploadAppearance = "dropzone" | "pill";
export type ProductLayout = "cards" | "rows" | "list" | "grid";
export type PaymentProvider = "stripe" | "paypal" | "square" | "mollie" | "braintree" | "authorizenet" | "paystack" | "mercadopago";
export type PaymentMode = "payment" | "subscription";
export type HiddenSource = "url_param" | "static" | "respondent" | "geo";
export type NotificationDocumentRecipient = "owner" | "respondent";
export type ConsentCategory = "analytics" | "marketing";
export type MetaPixelEvent = "Lead" | "CompleteRegistration" | "SubmitApplication" | "Contact";
export type CalculatedFormat = "number" | "currency" | "percent" | "text";
