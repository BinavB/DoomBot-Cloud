import { describe, expect, it } from "vitest";
import {
  activityLabel,
  monthDates,
  nextRoutineDay,
  toggleName,
  withIdleActivity,
  type BotActivity,
} from "@/lib/bots/client";

describe("doombot display helpers", () => {
  it("shows a working bot as working", () => {
    expect(
      activityLabel({
        running: 1,
        total: 3,
        failed: 0,
        lastStatus: "running",
        lastAt: null,
      }).text,
    ).toBe("Working now");
  });

  it("shows a bot with no tasks", () => {
    expect(
      activityLabel({
        running: 0,
        total: 0,
        failed: 0,
        lastStatus: null,
        lastAt: null,
      }).text,
    ).toBe("No tasks yet");
  });

  it("shows the last result with a time", () => {
    const done = activityLabel({
      running: 0,
      total: 1,
      failed: 0,
      lastStatus: "done",
      lastAt: "2026-11-07 10:30:00",
    });
    const failed = activityLabel({
      running: 0,
      total: 1,
      failed: 1,
      lastStatus: "failed",
      lastAt: "2026-11-07 10:30:00",
    });
    expect(done.text).toMatch(/^Done at \d{1,2}:\d{2}/);
    expect(failed.text).toMatch(/^Failed at \d{1,2}:\d{2}/);
    expect(failed.style).toBe("text-danger");
  });

  it("gives a bot without activity an idle one", () => {
    expect(
      withIdleActivity<{ id: number; activity?: BotActivity }>({ id: 1 })
        .activity,
    ).toEqual({
      running: 0,
      total: 0,
      failed: 0,
      lastStatus: null,
      lastAt: null,
    });
    const existing = {
      running: 2,
      total: 2,
      failed: 0,
      lastStatus: "running",
      lastAt: null,
    };
    expect(withIdleActivity({ activity: existing }).activity).toBe(existing);
  });

  it("toggles a tool in a list", () => {
    expect(toggleName(["a"], "b")).toEqual(["a", "b"]);
    expect(toggleName(["a", "b"], "a")).toEqual(["b"]);
  });

  it("picks a sensible default day for each frequency", () => {
    expect(nextRoutineDay("daily")).toBeNull();
    expect(nextRoutineDay("weekly")).toBeGreaterThanOrEqual(0);
    expect(nextRoutineDay("weekly")).toBeLessThanOrEqual(6);
    expect(nextRoutineDay("monthly")).toBeGreaterThanOrEqual(1);
  });

  it("lists the dates a monthly routine can use", () => {
    const dates = monthDates();
    expect(dates[0]).toBe(1);
    expect(dates[dates.length - 1]).toBe(28);
  });
});
