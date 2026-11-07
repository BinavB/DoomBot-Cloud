import { NextResponse } from "next/server";
import { withUser } from "@/lib/auth/route";
import { config } from "@/lib/config";
import { formatModelName } from "@/lib/model-name";

export const GET = withUser(async () => {
  const provider = config.aiProviders.find((candidate) => candidate.apiKey);
  const model = provider?.models[0];
  return NextResponse.json({
    name: model ? formatModelName(model) : "AI model",
    provider: provider?.name ?? null,
    backups: config.aiProviders.filter((candidate) => candidate.apiKey && candidate !== provider).map((item) => item.name),
  });
});
