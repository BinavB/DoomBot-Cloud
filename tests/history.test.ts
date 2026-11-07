import { describe, expect, it } from "vitest";
import { withinBudget } from "@/lib/agent/run";

const line = (id: number, size: number) => ({ id, role: "user" as const, content: "x".repeat(size) });

describe("history budget", () => {
  it("keeps the newest messages that fit", () => {
    const kept = withinBudget([line(1, 600), line(2, 600), line(3, 600)], 1300);
    expect(kept.map((message) => message.id)).toEqual([2, 3]);
  });

  it("always keeps the latest message, even if it is huge", () => {
    expect(withinBudget([line(1, 100), line(2, 5000)], 1000).map((message) => message.id)).toEqual([2]);
  });
});
