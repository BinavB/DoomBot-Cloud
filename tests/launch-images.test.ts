import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { launchImages } from "@/lib/launch-images";

describe("launch images", () => {
  it("has a file for every supported iPhone and iPad", () => {
    expect(launchImages).toHaveLength(14);
    for (const image of launchImages) {
      expect(existsSync(join(process.cwd(), "public", image.url))).toBe(true);
    }
  });
});
