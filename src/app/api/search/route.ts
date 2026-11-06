import { NextResponse } from "next/server";
import { withUser } from "@/lib/auth/route";
import { searchChats } from "@/lib/account-data";

const maxTermLength = 100;

export const GET = withUser(async (request: Request) => {
  const term = (new URL(request.url).searchParams.get("q") ?? "").trim().slice(0, maxTermLength);
  if (term.length < 2) {
    return NextResponse.json({ results: [] });
  }
  return NextResponse.json({ results: await searchChats(term) });
});
