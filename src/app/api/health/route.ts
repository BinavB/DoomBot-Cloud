import { NextResponse } from "next/server";
import { queryRow } from "@/lib/database";

export async function GET() {
  try {
    await queryRow("SELECT 1 AS ok");
    return NextResponse.json({ ok: true, database: "up" });
  } catch {
    return NextResponse.json({ ok: false, database: "down" }, { status: 503 });
  }
}
