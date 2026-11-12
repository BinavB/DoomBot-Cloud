import { describe, expect, it } from "vitest";
import { parseSkillCall, readSkillInput } from "@/lib/skills";

describe("skill calls in chat", () => {
  it("reads the skill name and the request after it", () => {
    expect(parseSkillCall("/mail-brief for today")).toEqual({ name: "mail-brief", request: "for today" });
  });

  it("accepts a skill call with no request", () => {
    expect(parseSkillCall("/mail-brief")).toEqual({ name: "mail-brief", request: "" });
  });

  it("ignores ordinary messages and paths", () => {
    expect(parseSkillCall("Check my mail")).toBeNull();
    expect(parseSkillCall("Use /mail-brief later")).toBeNull();
    expect(parseSkillCall("/")).toBeNull();
    expect(parseSkillCall("/A")).toBeNull();
  });
});

describe("skill input", () => {
  it("lowercases the name and trims the steps", () => {
    expect(readSkillInput({ name: " Mail-Brief ", instructions: "  Check mail.  " })).toEqual({
      name: "mail-brief",
      instructions: "Check mail.",
    });
  });

  it("rejects names with spaces, symbols or too few characters", () => {
    expect(() => readSkillInput({ name: "mail brief", instructions: "x" })).toThrow();
    expect(() => readSkillInput({ name: "mail_brief", instructions: "x" })).toThrow();
    expect(() => readSkillInput({ name: "a", instructions: "x" })).toThrow();
  });

  it("rejects empty or overlong steps", () => {
    expect(() => readSkillInput({ name: "mail-brief", instructions: "   " })).toThrow();
    expect(() => readSkillInput({ name: "mail-brief", instructions: "x".repeat(1501) })).toThrow();
  });
});
