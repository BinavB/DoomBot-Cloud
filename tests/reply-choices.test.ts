import { describe, expect, it } from "vitest";
import { splitChoices } from "@/lib/reply-choices";
import { setupStatus } from "@/lib/setup";

describe("reply choices", () => {
  it("splits the choices line from the reply", () => {
    expect(splitChoices("Which one?\n[[choices: Morning | Evening]]")).toEqual({
      body: "Which one?",
      choices: ["Morning", "Evening"],
    });
  });

  it("hides a choices line that is still streaming in", () => {
    expect(splitChoices("Which one?\n[[cho")).toEqual({ body: "Which one?", choices: [] });
    expect(splitChoices("Which one?\n[[choices: Morn")).toEqual({ body: "Which one?", choices: [] });
  });

  it("keeps ordinary text and drops empty or overlong options", () => {
    expect(splitChoices("Plain [[link]] text")).toEqual({ body: "Plain [[link]] text", choices: [] });
    const long = "x".repeat(61);
    expect(splitChoices(`Pick\n[[choices: A | | ${long} | B | C | D]]`).choices).toEqual(["A", "B", "C", "D"]);
  });
});

describe("setup checklist", () => {
  it("marks done items ready and missing items by need", () => {
    expect(setupStatus(true, true)).toBe("ready");
    expect(setupStatus(false, true)).toBe("needed");
    expect(setupStatus(false, false)).toBe("optional");
  });
});
