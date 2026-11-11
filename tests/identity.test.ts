import { describe, expect, it } from "vitest";
import { systemPrompt } from "@/lib/agent/run";
import { doombotIdentity } from "@/lib/identity";

describe("DOOMBOT identity", () => {
  it("names Binav only for creator questions and points to a Google search for contact details", () => {
    expect(doombotIdentity).toContain("unless the user asks about your creator or developer");
    expect(doombotIdentity).toContain("built by Binav");
    expect(doombotIdentity).toContain("google.com/search?q=binav.b");
    expect(doombotIdentity).toContain("ChatGPT");
    expect(doombotIdentity).toContain("OpenAI");
  });

  it("gives Binav's details when asked who he is, without mixing him up with other people", () => {
    expect(doombotIdentity).toContain("asks who Binav is");
    expect(doombotIdentity).toContain("full-stack web developer");
    expect(doombotIdentity).toContain("Flutter and Laravel");
    expect(doombotIdentity).toContain("more than three years");
    expect(doombotIdentity).toContain("do not mix him up with other people named Binav");
    expect(doombotIdentity).not.toContain("add nothing else about Binav");
  });

  it("puts the identity in the chief's system prompt", () => {
    expect(systemPrompt("", [])).toContain(doombotIdentity);
  });

  it("asks for fuller answers when the user wants an explanation or details", () => {
    const prompt = systemPrompt("", []);

    expect(prompt).toContain("Match the length of your answer to the question");
    expect(prompt).not.toContain("Be brief and practical");
  });
});
