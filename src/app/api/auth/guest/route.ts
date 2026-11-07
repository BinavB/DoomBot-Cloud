import { NextResponse } from "next/server";
import { cookieOptions } from "@/lib/auth/cookies";
import { canCreateGuest, createGuestUser } from "@/lib/auth/guest";
import { createSessionToken, sessionCookieName, sessionLifetimeSeconds } from "@/lib/auth/session";
import { config } from "@/lib/config";

const seeOther = 303;

export async function POST() {
  if (!(await canCreateGuest())) {
    return NextResponse.redirect(new URL("/login?error=guests-full", config.appUrl), seeOther);
  }
  const { user, sessionVersion } = await createGuestUser();
  const response = NextResponse.redirect(new URL("/", config.appUrl), seeOther);
  response.cookies.set(sessionCookieName, await createSessionToken(user.id, sessionVersion), cookieOptions(sessionLifetimeSeconds));
  return response;
}
