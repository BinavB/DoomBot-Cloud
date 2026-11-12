const providerLabels: Record<string, string> = {
  groq: "Groq",
  gemini: "Google Gemini",
  mistral: "Mistral",
  openrouter: "OpenRouter",
  deepseek: "DeepSeek",
};

export function providerLabel(name: string): string {
  return providerLabels[name] ?? name;
}

export function readProviderChoice(value: unknown, configured: string[]): string | null | undefined {
  if (value === null || value === "") {
    return null;
  }
  return typeof value === "string" && configured.includes(value) ? value : undefined;
}

export function orderProviders<T extends { name: string }>(providers: T[], preferred?: string): T[] {
  const first = providers.filter((provider) => provider.name === preferred);
  return [...first, ...providers.filter((provider) => provider.name !== preferred)];
}
