import { describe, expect, it } from "vitest";
import { runAsUser } from "@/lib/auth/context";
import { defaultTopics, maxTopics, normalizeTopics } from "@/lib/briefing/topics";
import { getBriefingTopics, saveBriefingTopics } from "@/lib/settings";

const zone = "Asia/Dubai";

describe("briefing topics", () => {
  it("keeps only known topics, once each, in a fixed order", () => {
    expect(normalizeTopics(["sport", "world", "sport", "made-up", 3])).toEqual(["world", "sport"]);
    expect(normalizeTopics("world")).toEqual([]);
  });

  it("limits how many topics can be picked", () => {
    const all = ["world", "politics", "business", "technology", "developer", "science", "health", "sport", "entertainment"];
    expect(normalizeTopics(all)).toHaveLength(maxTopics);
  });

  it("uses the defaults until someone picks, then remembers their pick", async () => {
    expect(await runAsUser(41, zone, () => getBriefingTopics())).toEqual(defaultTopics);
    await runAsUser(41, zone, () => saveBriefingTopics(["health", "sport"]));
    expect(await runAsUser(41, zone, () => getBriefingTopics())).toEqual(["health", "sport"]);
    expect(await runAsUser(42, zone, () => getBriefingTopics())).toEqual(defaultTopics);
  });
});
