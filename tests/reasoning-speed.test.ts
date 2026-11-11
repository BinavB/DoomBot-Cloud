import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/config", () => ({
  config: {
    dailyTokenLimit: 1_000_000,
    aiProviders: [
      { name: "groq", apiKey: "q", baseUrl: "https://groq.test", models: ["openai/gpt-oss-120b"] },
    ],
  },
}));
vi.mock("@/lib/usage", () => ({
  tokensUsedToday: async () => 0,
  guestTokensUsedToday: async () => 0,
  recordUsage: async () => undefined,
}));
vi.mock("@/lib/auth/context", () => ({
  currentUserIsGuest: () => false,
  currentUserId: () => 1,
}));

const { createChatCompletion } = await import("@/lib/ai");

function stubFetch() {
  const fetchMock = vi.fn(async () =>
    new Response(JSON.stringify({ choices: [{ message: { content: "ok" } }] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function sentBody(fetchMock: ReturnType<typeof stubFetch>): { reasoning_effort?: string } {
  const init = fetchMock.mock.calls[0] as unknown as [string, { body: string }];
  return JSON.parse(init[1].body);
}

describe("Groq reasoning effort", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("asks the gpt-oss model for low reasoning on normal replies so they start faster", async () => {
    const fetchMock = stubFetch();

    await createChatCompletion([{ role: "user", content: "hi" }]);

    expect(sentBody(fetchMock).reasoning_effort).toBe("low");
  });

  it("keeps high reasoning when the user turns Think mode on", async () => {
    const fetchMock = stubFetch();

    await createChatCompletion([{ role: "user", content: "hi" }], undefined, { reasoningEffort: "high" });

    expect(sentBody(fetchMock).reasoning_effort).toBe("high");
  });
});
