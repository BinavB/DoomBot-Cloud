import { describe, expect, it } from "vitest";
import { doombotIdentity, systemPrompt } from "@/lib/agent/run";

describe("DOOMBOT identity", () => {
  it("names Binav as the builder and rules out other AI brands", () => {
    expect(doombotIdentity).toContain("built by Binav");
    expect(doombotIdentity).toContain("ChatGPT");
    expect(doombotIdentity).toContain("OpenAI");
  });

  it("puts the identity in the chief's system prompt", () => {
    expect(systemPrompt("", [])).toContain(doombotIdentity);
  });
});
