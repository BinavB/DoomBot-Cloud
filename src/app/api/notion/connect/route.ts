import { NextResponse } from "next/server";
import { cookieOptions } from "@/lib/auth/cookies";
import { currentUserIsGuest } from "@/lib/auth/context";
import { withUser } from "@/lib/auth/route";
import { config } from "@/lib/config";
import {
  createNotionAuthorizationUrl,
  notionRedirectPath,
  notionStateCookieName,
  notionStateLifetimeSeconds,
} from "@/lib/notion";

export const GET = withUser(async () => {
  if (currentUserIsGuest()) {
    return NextResponse.redirect(new URL("/login?error=guest-google", config.appUrl));
  }
  try {
    const { url, state } = createNotionAuthorizationUrl();
    const response = NextResponse.redirect(url);
    response.cookies.set(
      notionStateCookieName,
      state,
      cookieOptions(notionStateLifetimeSeconds, notionRedirectPath),
    );
    return response;
  } catch {
    return NextResponse.redirect(new URL("/connections?notion=error", config.appUrl));
  }
});
