import { describe, it, expect } from "vitest";
import { FormFlowClient } from "./client";

function fakeFetch(body: unknown) {
  const calls: { url: string; init?: RequestInit }[] = [];
  const f = (async (url: string, init?: RequestInit) => { calls.push({ url, init }); return new Response(JSON.stringify(body), { status: 200 }); }) as unknown as typeof fetch;
  return { f, calls };
}

describe("onboarding client", () => {
  it("posts decide for backends and for respondent apps", async () => {
    const { f, calls } = fakeFetch({ data: { show: false, reason: "holdout" } });
    const c = new FormFlowClient({ apiKey: "k", baseUrl: "http://h", fetch: f });
    expect((await c.onboarding.decide({ entry: "first-launch", uid: "u1" })).reason).toBe("holdout");
    expect((await c.public.decide({ entry: "first-launch", uid: "u1", uid_sig: "ab" })).show).toBe(false);
    expect(calls[0].url).toBe("http://h/api/v1/onboarding/decide");
    expect(calls[1].url).toBe("http://h/api/v1/public/onboarding/decide");
    expect(JSON.parse(String(calls[1].init?.body))).toEqual({ entry: "first-launch", uid: "u1", uid_sig: "ab" });
  });
  it("reports journey events and reads the approval queue", async () => {
    const { f, calls } = fakeFetch({ data: [] });
    const c = new FormFlowClient({ apiKey: "k", baseUrl: "http://h", fetch: f });
    await c.onboarding.journeys.event("jrn_1", { uid: "u1", event: "first_project_created" });
    await c.onboarding.autopilot.actions({ experimentId: "exp_1", status: "pending" });
    expect(calls[0].url).toBe("http://h/api/v1/journeys/jrn_1/events");
    expect(calls[1].url).toContain("/autopilot/actions?");
    expect(calls[1].url).toContain("status=pending");
  });
});
