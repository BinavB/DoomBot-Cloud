import { describe, expect, it } from "vitest";
import { doombotIdentity, systemPrompt } from "@/lib/agent/run";

describe("DOOMBOT identity", () => {
  it("names Binav only for creator questions and points to a Google search for contact details", () => {
    expect(doombotIdentity).toContain("unless the user asks about your creator or developer");
    expect(doombotIdentity).toContain("built by Binav");
    expect(doombotIdentity).toContain("google.com/search?q=binav.b");
    expect(doombotIdentity).toContain("ChatGPT");
    expect(doombotIdentity).toContain("OpenAI");
  });

  it("puts the identity in the chief's system prompt", () => {
    expect(systemPrompt("", [])).toContain(doombotIdentity);
  });
});
