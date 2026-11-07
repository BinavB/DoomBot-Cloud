import { NextResponse, type NextRequest } from "next/server";
import { cookieOptions } from "@/lib/auth/cookies";
import { finishLogin, loginCookieName, loginCookiePath, parseLoginAttempt } from "@/lib/auth/google-login";
import { claimGuestAccount } from "@/lib/auth/guest";
import { readSessionToken, createSessionToken, sessionCookieName, sessionLifetimeSeconds } from "@/lib/auth/session";
import { findSession, upsertGoogleUser, type GoogleProfile, type SignedInUser } from "@/lib/auth/users";
import { config } from "@/lib/config";

function redirectTo(path: string): NextResponse {
  const response = NextResponse.redirect(new URL(path, config.appUrl));
  response.cookies.set(loginCookieName, "", cookieOptions(0, loginCookiePath));
  return response;
}

async function signIn(request: NextRequest, profile: GoogleProfile): Promise<SignedInUser> {
  const claims = await readSessionToken(request.cookies.get(sessionCookieName)?.value);
  const session = claims === null ? null : await findSession(claims.userId, claims.version);
  return session?.user.guest ? claimGuestAccount(session.user.id, profile) : upsertGoogleUser(profile);
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  if (params.get("error")) {
    return redirectTo("/login?error=denied");
  }

  const code = params.get("code");
  const state = params.get("state");
  const attempt = parseLoginAttempt(request.cookies.get(loginCookieName)?.value);
  if (!code || !state || !attempt || attempt.state !== state) {
    return redirectTo("/login?error=expired");
  }

  try {
    const { user, sessionVersion } = await signIn(request, await finishLogin(code, attempt));
    const response = redirectTo("/");
    response.cookies.set(sessionCookieName, await createSessionToken(user.id, sessionVersion), cookieOptions(sessionLifetimeSeconds));
    return response;
  } catch {
    return redirectTo("/login?error=failed");
  }
}
