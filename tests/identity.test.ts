import { describe, expect, it } from "vitest";
import { systemPrompt } from "@/lib/agent/run";
import { linkBinavHandle, removeLongDashes } from "@/lib/clean-text";
import { doombotIdentity, replyStyleRules } from "@/lib/identity";

describe("DOOMBOT identity", () => {
  it("names Binav only for creator questions and points to a Google search for contact details", () => {
    expect(doombotIdentity).toContain("unless the user asks about your creator or developer");
    expect(doombotIdentity).toContain("built by Binav");
    expect(doombotIdentity).toContain("google.com/search?q=binav.b");
    expect(doombotIdentity).toContain("[Search binav.b on Google](https://www.google.com/search?q=binav.b)");
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

describe("reply style", () => {
  it("asks for no long dashes, clickable links and a Google search when nothing is found", () => {
    expect(replyStyleRules).toContain("Never use the long dash");
    expect(replyStyleRules).toContain("Markdown form");
    expect(replyStyleRules).toContain("[Search Google for the topic](https://www.google.com/search?q=");
    expect(systemPrompt("", [])).toContain(replyStyleRules);
  });

  it("removes long dashes from shown replies but keeps number ranges", () => {
    expect(removeLongDashes("I’m back up — no issues")).toBe("I’m back up, no issues");
    expect(removeLongDashes("Fine – thanks")).toBe("Fine, thanks");
    expect(removeLongDashes("3–4 working days")).toBe("3–4 working days");
  });

  it("always links the binav.b handle to the Google search, whatever the model wrote", () => {
    const search = "https://www.google.com/search?q=binav.b";

    expect(linkBinavHandle("online as binav.b, a developer")).toBe(`online as [binav.b](${search}), a developer`);
    expect(linkBinavHandle("online as [binav.b](https://binav.b)")).toBe(`online as [binav.b](${search})`);
    expect(linkBinavHandle(`[Search binav.b on Google](${search})`)).toBe(`[Search binav.b on Google](${search})`);
    expect(linkBinavHandle("[docs](https://example.com) and binav.b")).toBe(`[docs](https://example.com) and [binav.b](${search})`);
  });
});
