import { describe, expect, it } from "vitest";
import { clampSidebarWidth, defaultSidebarWidth, maxSidebarWidth, minSidebarWidth } from "@/lib/sidebar-width";

describe("clampSidebarWidth", () => {
  it("keeps widths inside the allowed range", () => {
    expect(clampSidebarWidth(100, 1600)).toBe(minSidebarWidth);
    expect(clampSidebarWidth(900, 1600)).toBe(maxSidebarWidth);
    expect(clampSidebarWidth(300, 1600)).toBe(300);
  });

  it("never takes more than 45 percent of a small window", () => {
    expect(clampSidebarWidth(400, 800)).toBe(360);
  });

  it("falls back to the default for invalid values", () => {
    expect(clampSidebarWidth(Number.NaN, 1600)).toBe(defaultSidebarWidth);
  });
});
