import { describe, expect, it } from "vitest";
import { formatModelName } from "@/lib/model-name";

describe("model names", () => {
  it("makes readable names", () => {
    expect(formatModelName("gemini-3.5-flash")).toBe("Gemini 3.5 Flash");
    expect(formatModelName("llama-3.3-70b-versatile")).toBe("Llama 3.3 70b Versatile");
    expect(formatModelName("openrouter/free")).toBe("OpenRouter free");
  });
});
