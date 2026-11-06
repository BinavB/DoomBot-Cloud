import { NextResponse } from "next/server";
import { withUser } from "@/lib/auth/route";
import { readBody } from "@/lib/http";
import { deleteUserMemory } from "@/lib/settings";

export const DELETE = withUser(async (request: Request) => {
  const body = await readBody<{ id?: unknown }>(request);
  if (!body || typeof body.id !== "number") {
    return NextResponse.json({ error: "Send a numeric id." }, { status: 400 });
  }
  await deleteUserMemory(body.id);
  return NextResponse.json({ ok: true });
});
