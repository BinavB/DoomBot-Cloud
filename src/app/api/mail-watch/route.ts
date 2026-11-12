import { NextResponse } from "next/server";
import { getMailWatch, setMailWatch } from "@/lib/mail-watch";
import { withUser } from "@/lib/auth/route";
import { isGoogleConnected } from "@/lib/google/oauth";
import { readBody } from "@/lib/http";

export const GET = withUser(async () => NextResponse.json(await getMailWatch()));

export const PUT = withUser(async (request: Request) => {
  const body = await readBody<{ enabled?: unknown }>(request);
  if (!body || typeof body.enabled !== "boolean") {
    return NextResponse.json({ error: "Send enabled as true or false." }, { status: 400 });
  }
  if (body.enabled && !(await isGoogleConnected())) {
    return NextResponse.json({ error: "Connect Google first, then turn on email alerts." }, { status: 400 });
  }
  await setMailWatch(body.enabled);
  return NextResponse.json({ ok: true });
});
