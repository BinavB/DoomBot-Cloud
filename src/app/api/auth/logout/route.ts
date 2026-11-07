import { NextResponse } from "next/server";
import { cookieOptions } from "@/lib/auth/cookies";
import { currentSession } from "@/lib/auth/route";
import { sessionCookieName } from "@/lib/auth/session";
import { revokeSessions } from "@/lib/auth/users";

export async function POST() {
  const session = await currentSession();
  if (session) {
    await revokeSessions(session.user.id);
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookieName, "", cookieOptions(0));
  return response;
}
