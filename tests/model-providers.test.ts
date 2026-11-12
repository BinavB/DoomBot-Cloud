import { describe, expect, it } from "vitest";
import { orderProviders, providerLabel, readProviderChoice } from "@/lib/model-providers";

describe("model provider choice", () => {
  it("accepts automatic and configured providers only", () => {
    const configured = ["groq", "gemini"];
    expect(readProviderChoice("", configured)).toBeNull();
    expect(readProviderChoice(null, configured)).toBeNull();
    expect(readProviderChoice("gemini", configured)).toBe("gemini");
    expect(readProviderChoice("deepseek", configured)).toBeUndefined();
    expect(readProviderChoice(42, configured)).toBeUndefined();
  });

  it("puts the chosen provider first and keeps the others as fallback", () => {
    const providers = [{ name: "groq" }, { name: "gemini" }, { name: "mistral" }];
    expect(orderProviders(providers, "gemini").map((provider) => provider.name)).toEqual(["gemini", "groq", "mistral"]);
    expect(orderProviders(providers).map((provider) => provider.name)).toEqual(["groq", "gemini", "mistral"]);
  });

  it("shows readable names", () => {
    expect(providerLabel("gemini")).toBe("Google Gemini");
    expect(providerLabel("unknown")).toBe("unknown");
  });
});
