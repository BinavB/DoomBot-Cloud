import { cookies } from "next/headers";
import { connection, NextResponse } from "next/server";
import { runAsUser } from "@/lib/auth/context";
import { readSessionToken, sessionCookieName } from "@/lib/auth/session";
import { findSession, type Session } from "@/lib/auth/users";

export async function currentSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const claims = await readSessionToken(cookieStore.get(sessionCookieName)?.value);
  return claims === null ? null : await findSession(claims.userId, claims.version);
}

export function withUser<Args extends unknown[]>(
  handler: (...args: Args) => Promise<Response>,
): (...args: Args) => Promise<Response> {
  return async (...args) => {
    await connection();
    const session = await currentSession();
    if (!session) {
      return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
    }
    return runAsUser(session.user.id, session.timeZone, () => handler(...args), session.user.guest);
  };
}
