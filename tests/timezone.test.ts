import { describe, expect, it } from "vitest";
import { runAsUser } from "@/lib/auth/context";
import { getTimeZone, saveDetectedTimeZone, saveTimeZone } from "@/lib/settings";

const fallback = "Asia/Dubai";

describe("time zone detection", () => {
  it("fills in a time zone for someone who has not chosen one", async () => {
    expect(await runAsUser(51, fallback, () => getTimeZone())).toBe(fallback);
    expect(await runAsUser(51, fallback, () => saveDetectedTimeZone("Asia/Kolkata"))).toBe(true);
    expect(await runAsUser(51, fallback, () => getTimeZone())).toBe("Asia/Kolkata");
  });

  it("never overrides a time zone the person picked", async () => {
    await runAsUser(52, fallback, () => saveTimeZone("Europe/London"));
    await runAsUser(52, fallback, () => saveDetectedTimeZone("Asia/Kolkata"));
    expect(await runAsUser(52, fallback, () => getTimeZone())).toBe("Europe/London");
  });

  it("rejects an unknown time zone", async () => {
    expect(await runAsUser(53, fallback, () => saveDetectedTimeZone("Mars/Olympus"))).toBe(false);
  });
});
