import { NextResponse } from "next/server";
import { deleteAccountData } from "@/lib/account-data";
import { cookieOptions } from "@/lib/auth/cookies";
import { withUser } from "@/lib/auth/route";
import { sessionCookieName } from "@/lib/auth/session";

export const POST = withUser(async (request: Request) => {
  const body = (await request.json()) as { confirm?: unknown };
  if (body.confirm !== "DELETE") {
    return NextResponse.json({ error: "Type DELETE to confirm." }, { status: 400 });
  }
  await deleteAccountData();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookieName, "", cookieOptions(0));
  return response;
});
