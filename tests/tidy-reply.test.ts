import { describe, expect, it } from "vitest";
import { tidyReply } from "@/lib/clean-text";
import { replyStyleRules } from "@/lib/identity";

describe("tidy reply", () => {
  it("turns a table into a readable list with no pipes or dashes", () => {
    const table = ["Here are the plans:", "", "| Plan | Price | Speed |", "|---|:---:|---|", "| **Basic** | $5 | Slow |", "| Pro | $15 | Fast |"].join("\n");

    const tidy = tidyReply(table);

    expect(tidy).toContain("- Basic: Price $5, Speed Slow");
    expect(tidy).toContain("- Pro: Price $15, Speed Fast");
    expect(tidy).not.toContain("|");
    expect(tidy).not.toContain("---");
  });

  it("removes horizontal lines made of dashes, stars or underscores", () => {
    expect(tidyReply("Intro\n\n---\n\nMore\n* * *\nEnd")).toBe("Intro\n\nMore\nEnd");
  });

  it("closes bold that touches the next word so no stars are left showing", () => {
    expect(tidyReply("**Morning:**review the inbox")).toBe("**Morning:** review the inbox");
  });

  it("drops a half-written bold marker while a reply is still streaming", () => {
    expect(tidyReply("1. **Morning**: inbox\n2. **Midd")).toBe("1. **Morning**: inbox\n2. Midd");
  });

  it("leaves code blocks exactly as written", () => {
    const code = "```\n| a | b |\n|---|---|\n---\n```";

    expect(tidyReply(`Example:\n${code}`)).toBe(`Example:\n${code}`);
  });

  it("asks the model for smooth, emoji-led replies without symbols", () => {
    expect(replyStyleRules).toContain("Never use bold or asterisks, tables, pipe characters, horizontal lines");
    expect(replyStyleRules).toContain("fitting emoji");
  });
});
