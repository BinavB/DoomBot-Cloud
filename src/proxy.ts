import { NextResponse, type NextRequest } from "next/server";
import { readSessionToken, sessionCookieName } from "@/lib/auth/session";

const publicPaths = ["/login", "/privacy", "/terms", "/api/health", "/robots.txt", "/api/auth/logout", "/api/auth/guest", "/api/cron", "/manifest.webmanifest", "/sw.js", "/icon.svg", "/icon-512.png", "/apple-icon.png"];
const publicPrefixes = ["/api/auth/google/", "/share/", "/api/share/"];
const safeMethods = ["GET", "HEAD", "OPTIONS"];

function isPublic(pathname: string): boolean {
  return publicPaths.includes(pathname) || publicPrefixes.some((prefix) => pathname.startsWith(prefix));
}

function isCrossSiteWrite(request: NextRequest): boolean {
  if (safeMethods.includes(request.method)) {
    return false;
  }
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") {
    return true;
  }
  const origin = request.headers.get("origin");
  if (!origin) {
    return false;
  }
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    return new URL(origin).host !== host;
  } catch {
    return true;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith("/api/");

  if (isCrossSiteWrite(request)) {
    return NextResponse.json({ error: "Cross-site requests are not allowed." }, { status: 403 });
  }
  if (isPublic(pathname)) {
    return NextResponse.next();
  }
  const claims = await readSessionToken(request.cookies.get(sessionCookieName)?.value);
  if (claims !== null) {
    return NextResponse.next();
  }
  if (isApi) {
    return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
