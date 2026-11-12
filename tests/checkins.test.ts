import { describe, expect, it } from "vitest";
import { dueCheckinSlot, readCheckinTimes } from "@/lib/checkins";

describe("check-in times", () => {
  it("accepts whole times and returns them sorted without repeats", () => {
    expect(readCheckinTimes(["16:30", "09:00", "09:00"])).toEqual(["09:00", "16:30"]);
  });

  it("rejects times that are not HH:MM", () => {
    expect(() => readCheckinTimes(["9:00"])).toThrow("Check-in times must be whole times like 09:00.");
    expect(() => readCheckinTimes(["25:00"])).toThrow();
    expect(() => readCheckinTimes("09:00")).toThrow();
  });

  it("rejects more than six times", () => {
    const seven = ["01:00", "02:00", "03:00", "04:00", "05:00", "06:00", "07:00"];
    expect(() => readCheckinTimes(seven)).toThrow("You can set up to 6 check-in times.");
  });
});

describe("due check-in slot", () => {
  it("picks the latest time that has passed", () => {
    expect(dueCheckinSlot(["09:00", "16:30"], "17:10")).toBe("16:30");
    expect(dueCheckinSlot(["09:00", "16:30"], "10:00")).toBe("09:00");
  });

  it("returns nothing before the first time", () => {
    expect(dueCheckinSlot(["09:00", "16:30"], "08:59")).toBeNull();
  });
});
