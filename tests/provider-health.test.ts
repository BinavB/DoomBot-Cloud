import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isCoolingDown, markFailed, resetProviderHealth } from "@/lib/provider-health";

vi.mock("@/lib/config", () => ({
  config: {
    dailyTokenLimit: 1_000_000,
    aiProviders: [
      { name: "gemini", apiKey: "g", baseUrl: "https://gemini.test", models: ["broken-model"] },
      { name: "groq", apiKey: "q", baseUrl: "https://groq.test", models: ["fast-model"] },
    ],
  },
}));
vi.mock("@/lib/usage", () => ({
  tokensUsedToday: async () => 0,
  guestTokensUsedToday: async () => 0,
  recordUsage: async () => undefined,
}));
vi.mock("@/lib/auth/context", () => ({ currentUserIsGuest: () => false }));

const { busyMessage, createChatCompletion } = await import("@/lib/ai");

function reply(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

const okBody = { choices: [{ message: { content: "hello" } }] };

describe("provider health", () => {
  beforeEach(() => resetProviderHealth());

  it("cools down a model after a rate limit and lets it back after a minute", () => {
    markFailed("groq", "fast-model", 429, 1_000);
    expect(isCoolingDown("groq", "fast-model", 30_000)).toBe(true);
    expect(isCoolingDown("groq", "fast-model", 62_000)).toBe(false);
  });

  it("cools down the whole provider when its key or balance fails", () => {
    markFailed("deepseek", "deepseek-chat", 402, 0);
    expect(isCoolingDown("deepseek", "another-model", 1_000)).toBe(true);
  });
});

describe("chat completion fallback", () => {
  beforeEach(() => resetProviderHealth());
  afterEach(() => vi.unstubAllGlobals());

  it("skips a model that just failed, so the next reply goes straight to a working provider", async () => {
    const fetchMock = vi.fn(async (url: string) =>
      url.startsWith("https://gemini.test") ? reply(404, { error: "no such model" }) : reply(200, okBody),
    );
    vi.stubGlobal("fetch", fetchMock);

    expect((await createChatCompletion([{ role: "user", content: "hi" }])).content).toBe("hello");
    expect(fetchMock).toHaveBeenCalledTimes(2);

    fetchMock.mockClear();
    expect((await createChatCompletion([{ role: "user", content: "hi again" }])).content).toBe("hello");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain("groq.test");
  });

  it("shows a short message instead of provider errors when every provider fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reply(400, { error: { message: "Request contains an invalid argument." } })));
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const failure = createChatCompletion([{ role: "user", content: "hi" }]);

    await expect(failure).rejects.toThrow(busyMessage);
    await expect(failure).rejects.not.toThrow(/request failed|invalid argument|gemini|groq/i);
  });
});
