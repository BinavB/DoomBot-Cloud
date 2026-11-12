import { NextResponse } from "next/server";
import { configuredProviderNames } from "@/lib/ai";
import { withUser } from "@/lib/auth/route";
import { providerLabel } from "@/lib/model-providers";

export const GET = withUser(async () => {
  const providers = configuredProviderNames().map((name) => ({ name, label: providerLabel(name) }));
  return NextResponse.json({ providers });
});
