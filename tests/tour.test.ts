import { describe, expect, it } from "vitest";
import { features } from "@/lib/tour/features";
import { compactBreakpoint, placeCard } from "@/lib/tour/placement";
import { tourKeyFor, tours } from "@/lib/tour/tours";

const desktop = { width: 1280, height: 800 };

describe("tour steps", () => {
  it("maps pages to tours", () => {
    expect(tourKeyFor("/")).toBe("chat");
    expect(tourKeyFor("/bots")).toBe("bots");
    expect(tourKeyFor("/login")).toBeNull();
  });

  it("only links to features that exist", () => {
    for (const steps of Object.values(tours)) {
      expect(steps.length).toBeGreaterThan(0);
      for (const step of steps) {
        if (step.feature) {
          expect(features[step.feature]).toBeDefined();
        }
      }
    }
  });
});

describe("placeCard", () => {
  it("centres the card when there is no target", () => {
    expect(placeCard(null, 200, desktop)).toEqual({ top: 300, left: 460, width: 360 });
  });

  it("puts the card below a target near the top", () => {
    const placement = placeCard({ top: 20, left: 20, width: 200, height: 40 }, 200, desktop);
    expect(placement.top).toBe(76);
    expect(placement.left).toBe(16);
  });

  it("puts the card above a target near the bottom", () => {
    const placement = placeCard({ top: 700, left: 400, width: 600, height: 60 }, 200, desktop);
    expect(placement.top).toBe(484);
  });

  it("uses a full-width sheet on phones", () => {
    const placement = placeCard({ top: 700, left: 0, width: 300, height: 60 }, 200, { width: compactBreakpoint - 1, height: 800 });
    expect(placement).toEqual({ top: 16, left: 16, width: compactBreakpoint - 33 });
  });
});
