import { NextResponse, type NextRequest } from "next/server";
import { cookieOptions } from "@/lib/auth/cookies";
import { withUser } from "@/lib/auth/route";
import { config } from "@/lib/config";
import { exchangeNotionCode, notionRedirectPath, notionStateCookieName } from "@/lib/notion";

function settingsWith(status: string): NextResponse {
  const response = NextResponse.redirect(new URL(`/settings?notion=${status}`, config.appUrl));
  response.cookies.set(notionStateCookieName, "", cookieOptions(0, notionRedirectPath));
  return response;
}

export const GET = withUser(async (request: NextRequest) => {
  const params = request.nextUrl.searchParams;
  if (params.get("error")) {
    return settingsWith("denied");
  }
  const code = params.get("code");
  const state = params.get("state");
  if (!code || !state || state !== request.cookies.get(notionStateCookieName)?.value) {
    return settingsWith("error");
  }
  try {
    await exchangeNotionCode(code);
    return settingsWith("connected");
  } catch {
    return settingsWith("error");
  }
});
