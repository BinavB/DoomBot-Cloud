import { timingSafeEqual } from "node:crypto";
import { connection, NextResponse } from "next/server";
import { runScheduledWork } from "@/lib/scheduler";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || secret.length < 16) {
    return false;
  }
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function GET(request: Request) {
  await connection();
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Not allowed." }, { status: 401 });
  }
  await runScheduledWork();
  return NextResponse.json({ ok: true });
}
