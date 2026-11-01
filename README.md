# FormFlow TypeScript SDK v2

[![CI](https://github.com/formizeflow/formflow-js/actions/workflows/ci.yml/badge.svg)](https://github.com/formizeflow/formflow-js/actions/workflows/ci.yml)

Zero dependencies, Node 18+ and modern browsers (`fetch`, WebCrypto, `AbortSignal`). Never ship an API key to a browser: use `ff.public` (no key) or the embed SDK there.

```ts
import { FormFlowClient, form, constructWebhookEvent, ConflictError } from "@formizeflow/sdk";

const ff = new FormFlowClient({ apiKey: process.env.FORMFLOW_API_KEY!, baseUrl: "https://forms.example.com" });
console.log(await ff.account.me()); // credential, workspace, scopes
```

## Build a form in code

```ts
const def = form("Customer feedback")
  .welcome({ title: "2 minutes, promise", buttonLabel: "Start" })
  .nps("nps")
  .longText("why", "What is the main reason for your score?")
  .choice("channel", "How did you find us?", ["Search", "Friend", "Social"], { multiple: true })
  .email("email", "Email (optional)")
  .theme({ colors: { primary: "#4f46e5", background: "#0b1020", text: "#f8fafc" }, colorScheme: "dark", alignment: "center" })
  .settings({ presentation: "conversational", notifications: { ownerEmails: ["team@example.com"] } })
  .ending("Thank you!", "We read every answer.")
  .build();

const created = await ff.forms.create({ name: "Feedback", definition: def });
await ff.forms.update(created.id, { password: "s3cret-launch" }); // write-only; response has passwordRequired: true
const { version, warnings } = await ff.forms.publish(created.id);
const links = await ff.forms.share(created.id); // hosted URL, QR, embed snippets
```

## Edit atomically

```ts
await ff.forms.edit(created.id, (f) => [
  { op: "add_field", field: { id: "company", type: "company", label: "Company" }, index: 1 },
  { op: "set_theme", theme: { radius: 20 } },
]); // all-or-nothing, returns engine `issues`
```

## Responses, pagination, cancellation

```ts
const ac = new AbortController();
for await (const s of ff.submissions.listAll(created.id, { status: "completed", limit: 100, expand: ["form"], redact: "sensitive" }, { signal: ac.signal })) {
  console.log(s.id, s.answers);
}
const hot = await ff.submissions.search(created.id, { filters: { type: "condition", source: { kind: "field", id: "nps" }, operator: "lte", value: 6 }, fields: ["nps", "why"] });
const job = await ff.submissions.export(created.id, { format: "xlsx" });
const done = await ff.exports.wait(job.export.id); // done.url
```

## Analytics and AI

```ts
await ff.analytics.metrics(id, { from: Date.now() - 7 * 864e5 });
await ff.analytics.satisfaction(id);                     // NPS / CSAT / CES
const a = await ff.ai.analyzeResponses(id, { question: "What annoys detractors?" }); // always show a.caveats
const gen = await ff.ai.generateForm({ prompt: "Event registration with meal preferences", create: { name: "Event" } });
```

## Webhooks (typed)

```ts
export async function POST(req: Request) {
  const event = await constructWebhookEvent(await req.text(), req.headers.get("formflow-signature"), process.env.WEBHOOK_SECRET!);
  switch (event.type) {
    case "submission.completed": return handle(event.data.answers, event.data.labels);
    case "form.published": /* event.data.slug */ break;
  }
  return new Response("ok");
}
```

## Experiments and conversions
```ts
// your backend, when a user reaches the goal (key needs form:write); uid is the id your app passes to the form
await ff.experiments.reportConversion("exp_123", { uid: "user_42", event: "subscribed", value: 9.99, eventId: "sub_abc" });
const results = await ff.experiments.results("exp_123"); // frequentist + Bayesian, funnels, sample-ratio check
```

## Errors, retries, options

`FormFlowError` (`status`, `code`, `details`, `requestId`) with subclasses `AuthenticationError`, `PermissionError`, `NotFoundError`, `ConflictError` (`details.currentRevision`), `ValidationError` (`details.issues`), `RateLimitError` (`retryAfterSec`). 429, 5xx and network errors are retried with backoff honoring `Retry-After` (`maxRetries`, default 3); POSTs carry an automatic `Idempotency-Key`. Every method accepts `{ signal, idempotencyKey }`. Client options: `apiKey`, `baseUrl`, `version`, `maxRetries`, `timeoutMs`, `workspaceId`, `fetch`.

## Respondent endpoints (no key)

`ff.public.getForm(slug)`, `unlock(slug, password)` (httpOnly cookie; use `credentials: "include"` in browsers), `start`, `save`, `complete`.

The types in `resources/*.ts` are maintained by hand next to `/openapi.json`; when you add an endpoint, update both.
