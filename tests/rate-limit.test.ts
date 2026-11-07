import { describe, expect, it } from "vitest";
import { maxRequestsPerWindow, takeChatSlot, windowMilliseconds } from "@/lib/rate-limit";

describe("rate limit", () => {
  it("allows the limit then blocks, per account", async () => {
    const now = 1_700_000_000_000;
    for (let count = 0; count < maxRequestsPerWindow; count++) {
      expect(await takeChatSlot(10, now)).toBe(true);
    }
    expect(await takeChatSlot(10, now)).toBe(false);
    expect(await takeChatSlot(11, now)).toBe(true);
  });

  it("opens again in the next minute", async () => {
    const now = 1_700_000_600_000;
    for (let count = 0; count < maxRequestsPerWindow + 1; count++) {
      await takeChatSlot(12, now);
    }
    expect(await takeChatSlot(12, now + windowMilliseconds)).toBe(true);
  });
});
