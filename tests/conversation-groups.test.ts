import { describe, expect, it } from "vitest";
import { groupByDate } from "@/lib/conversation-groups";

const now = new Date(2026, 10, 7, 12, 0, 0);
const stamp = (daysAgo: number) =>
  new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace("T", " ");

describe("date grouping", () => {
  it("buckets chats by age and drops empty groups", () => {
    const groups = groupByDate(
      [
        { id: "a", updatedAt: stamp(0) },
        { id: "b", updatedAt: stamp(1) },
        { id: "c", updatedAt: stamp(4) },
        { id: "d", updatedAt: stamp(20) },
        { id: "e", updatedAt: stamp(90) },
      ],
      now,
    );
    expect(groups.map((group) => group.label)).toEqual(["Today", "Yesterday", "Previous 7 days", "Previous 30 days", "Older"]);
  });

  it("returns only the groups that have chats", () => {
    expect(groupByDate([{ updatedAt: stamp(0) }], now).map((group) => group.label)).toEqual(["Today"]);
  });

  it("keeps the given order inside a group", () => {
    const groups = groupByDate([{ id: "new", updatedAt: stamp(0) }, { id: "old", updatedAt: stamp(0) }], now);
    expect(groups[0].items.map((item) => item.id)).toEqual(["new", "old"]);
  });
});
