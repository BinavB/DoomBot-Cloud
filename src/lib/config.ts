function readText(name: string, fallback: string): string {
  const value = process.env[name]?.trim();
  return value ? value : fallback;
}

function readNumber(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) {
    return fallback;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export interface AiProvider {
  name: string;
  apiKey: string;
  baseUrl: string;
  models: string[];
}

function readList(name: string, fallback: string): string[] {
  return readText(name, fallback)
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

const providerCatalog: Record<string, () => AiProvider> = {
  gemini: () => ({
    name: "gemini",
    apiKey: readText("GEMINI_API_KEY", ""),
    baseUrl: readText(
      "GEMINI_BASE_URL",
      "https://generativelanguage.googleapis.com/v1beta/openai",
    ),
    models: [
      ...new Set([
        readText("GEMINI_MODEL", "gemini-3.5-flash"),
        ...readList(
          "GEMINI_FALLBACK_MODELS",
          "gemini-3.1-flash-lite,gemini-3.5-flash-lite,gemini-3.6-flash",
        ),
      ]),
    ],
  }),
  groq: () => ({
    name: "groq",
    apiKey: readText("GROQ_API_KEY", ""),
    baseUrl: readText("GROQ_BASE_URL", "https://api.groq.com/openai/v1"),
    models: [
      ...new Set([
        readText("GROQ_MODEL", "openai/gpt-oss-120b"),
        ...readList("GROQ_FALLBACK_MODELS", "llama-3.1-8b-instant"),
      ]),
    ],
  }),
  mistral: () => ({
    name: "mistral",
    apiKey: readText("MISTRAL_API_KEY", ""),
    baseUrl: readText("MISTRAL_BASE_URL", "https://api.mistral.ai/v1"),
    models: [readText("MISTRAL_MODEL", "mistral-small-latest")],
  }),
  openrouter: () => ({
    name: "openrouter",
    apiKey: readText("OPENROUTER_API_KEY", ""),
    baseUrl: readText("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"),
    models: [readText("OPENROUTER_MODEL", "openrouter/free")],
  }),
  deepseek: () => ({
    name: "deepseek",
    apiKey: readText("DEEPSEEK_API_KEY", ""),
    baseUrl: readText("DEEPSEEK_BASE_URL", "https://api.deepseek.com"),
    models: [readText("DEEPSEEK_MODEL", "deepseek-chat")],
  }),
};

function readProviders(): AiProvider[] {
  return readText("AI_PROVIDERS", "groq,gemini,mistral,openrouter,deepseek")
    .split(",")
    .map((name) => name.trim().toLowerCase())
    .filter((name) => name in providerCatalog)
    .map((name) => providerCatalog[name]());
}

export const config = {
  aiProviders: readProviders(),
  timezone: readText("APP_TIMEZONE", "Asia/Dubai"),
  briefingTime: readText("BRIEFING_TIME", "07:00"),
  cityName: readText("WEATHER_CITY", "Dubai"),
  latitude: readNumber("WEATHER_LATITUDE", 25.2048),
  longitude: readNumber("WEATHER_LONGITUDE", 55.2708),
  dailyTokenLimit: readNumber("DAILY_TOKEN_LIMIT", 200000),
  databaseUrl: readText("TURSO_DATABASE_URL", "file:data/agent.db"),
  databaseToken: readText("TURSO_AUTH_TOKEN", ""),
  googleClientId: readText("GOOGLE_CLIENT_ID", ""),
  googleClientSecret: readText("GOOGLE_CLIENT_SECRET", ""),
  appUrl: readText("APP_URL", "http://localhost:3000").replace(/\/+$/, ""),
};
