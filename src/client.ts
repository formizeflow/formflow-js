import { HttpClient, DEFAULT_VERSION, type ClientOptions } from "./core";
import { FormsResource } from "./resources/forms";
import { SubmissionsResource } from "./resources/submissions";
import { ThemesResource } from "./resources/themes";
import { TemplatesResource } from "./resources/templates";
import { WebhooksResource } from "./resources/webhooks";
import { AnalyticsResource } from "./resources/analytics";
import { AiResource } from "./resources/ai";
import { AccountResource } from "./resources/account";
import { ExportsResource } from "./resources/exports";
import { PublicClient } from "./resources/public";
import { ResultsResource } from "./resources/results";
import { PaymentsResource } from "./resources/payments";
import { SchedulingResource } from "./resources/scheduling";
import { WorkflowsResource } from "./resources/workflows";
import { ExperimentsResource } from "./resources/experiments";
import { DestinationsResource } from "./resources/destinations";
import { OnboardingResource } from "./resources/onboarding";
import { PlatformResource } from "./resources/platform";
import { InsightsResource } from "./resources/insights";
import { LibraryResource } from "./resources/library";
import { DistributionResource } from "./resources/distribution";
import { AdminResource } from "./resources/admin";

export { DEFAULT_VERSION };
export type { ClientOptions, ListParams, Page, RequestOptions } from "./core";

/** FormFlow API client. One instance per API key. */
export class FormFlowClient {
  private readonly http: HttpClient;
  readonly forms: FormsResource;
  readonly submissions: SubmissionsResource;
  readonly themes: ThemesResource;
  readonly templates: TemplatesResource;
  readonly webhooks: WebhooksResource;
  readonly analytics: AnalyticsResource;
  readonly ai: AiResource;
  readonly exports: ExportsResource;
  readonly account: AccountResource;
  readonly results: ResultsResource;
  readonly payments: PaymentsResource;
  readonly scheduling: SchedulingResource;
  readonly workflows: WorkflowsResource;
  readonly experiments: ExperimentsResource;
  readonly destinations: DestinationsResource;
  readonly onboarding: OnboardingResource;
  readonly platform: PlatformResource;
  readonly insights: InsightsResource;
  readonly library: LibraryResource;
  readonly distribution: DistributionResource;
  /** Audiences, tags, team templates, org security, roles, groups, brand kit, domain join, partner provisioning. */
  readonly admin: AdminResource;
  /** Respondent endpoints (no API key). */
  readonly public: PublicClient;

  constructor(o: ClientOptions) {
    this.http = new HttpClient(o);
    this.forms = new FormsResource(this.http);
    this.submissions = new SubmissionsResource(this.http);
    this.themes = new ThemesResource(this.http);
    this.templates = new TemplatesResource(this.http);
    this.webhooks = new WebhooksResource(this.http);
    this.analytics = new AnalyticsResource(this.http);
    this.ai = new AiResource(this.http);
    this.exports = new ExportsResource(this.http);
    this.account = new AccountResource(this.http);
    this.results = new ResultsResource(this.http);
    this.payments = new PaymentsResource(this.http);
    this.scheduling = new SchedulingResource(this.http);
    this.workflows = new WorkflowsResource(this.http);
    this.experiments = new ExperimentsResource(this.http);
    this.destinations = new DestinationsResource(this.http);
    this.onboarding = new OnboardingResource(this.http);
    this.platform = new PlatformResource(this.http);
    this.insights = new InsightsResource(this.http);
    this.library = new LibraryResource(this.http);
    this.distribution = new DistributionResource(this.http);
    this.admin = new AdminResource(this.http);
    this.public = new PublicClient({ baseUrl: this.http.opts.baseUrl, fetch: o.fetch });
  }

  /** Escape hatch for endpoints without a typed method. */
  request<T = unknown>(method: string, path: string, init?: { query?: object; body?: unknown; signal?: AbortSignal; idempotencyKey?: string }) { return this.http.request<T>(method, path, init); }
  /** Auto-paginate any list endpoint. */
  paginate<T>(path: string, q?: object, o?: { signal?: AbortSignal }) { return this.http.paginate<T>(path, q, o); }

  // Backward-compatible shortcuts (SDK v1 surface).
  get members() { return this.account.members; }
  get apiKeys() { return this.account.apiKeys; }
  get auditEvents() { return this.account.auditEvents; }
  get usage() { return { get: (period?: string) => this.account.usage(period) }; }
}
export { FormFlowClient as FormFlow };
