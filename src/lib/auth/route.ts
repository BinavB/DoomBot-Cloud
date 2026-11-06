import { cookies } from "next/headers";
import { connection, NextResponse } from "next/server";
import { runAsUser } from "@/lib/auth/context";
import { readSessionToken, sessionCookieName } from "@/lib/auth/session";
import { findSessionUser, type User } from "@/lib/auth/users";

export async function currentSessionUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const claims = await readSessionToken(cookieStore.get(sessionCookieName)?.value);
  return claims === null ? null : await findSessionUser(claims.userId, claims.version);
}

export function withUser<Args extends unknown[]>(
  handler: (...args: Args) => Promise<Response>,
): (...args: Args) => Promise<Response> {
  return async (...args) => {
    await connection();
    const user = await currentSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
    }
    return runAsUser(user.id, () => handler(...args));
  };
}
