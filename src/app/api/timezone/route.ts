import { NextResponse } from "next/server";
import { withUser } from "@/lib/auth/route";
import { readBody } from "@/lib/http";
import { saveDetectedTimeZone } from "@/lib/settings";

export const POST = withUser(async (request: Request) => {
  const body = await readBody<{ timeZone?: unknown }>(request);
  if (!body || typeof body.timeZone !== "string" || !(await saveDetectedTimeZone(body.timeZone))) {
    return NextResponse.json({ error: "That time zone is not recognised." }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
});
