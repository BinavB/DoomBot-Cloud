import { NextResponse } from "next/server";
import { disconnectGoogle, isGoogleConnected } from "@/lib/google/oauth";
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
  if (body?.app === "google") {
    await disconnectGoogle();
  } else if (body?.app === "notion") {
    await disconnectNotion();
  } else {
    return NextResponse.json({ error: "Send the app name google or notion." }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
});
