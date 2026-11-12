import { NextResponse } from "next/server";
import { isGoogleConnected } from "@/lib/google/oauth";
import { withUser } from "@/lib/auth/route";
import { readBody } from "@/lib/http";
import { disconnectNotion, isNotionConnected, isNotionSignInConfigured } from "@/lib/notion";

export const GET = withUser(async () =>
  NextResponse.json({
    google: await isGoogleConnected(),
    notion: await isNotionConnected(),
    notionAvailable: isNotionSignInConfigured(),
  }),
);

export const DELETE = withUser(async (request: Request) => {
  const body = await readBody<{ app?: unknown }>(request);
  if (body?.app !== "notion") {
    return NextResponse.json({ error: "Send the app name notion." }, { status: 400 });
  }
  await disconnectNotion();
  return NextResponse.json({ ok: true });
});
