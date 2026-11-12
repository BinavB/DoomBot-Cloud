import { NextResponse } from "next/server";
import { deleteLibraryItem, listLibrary } from "@/lib/library";
import { withUser } from "@/lib/auth/route";
import { readBody } from "@/lib/http";

export const GET = withUser(async () => NextResponse.json({ items: await listLibrary() }));

export const DELETE = withUser(async (request: Request) => {
  const body = await readBody<{ id?: unknown }>(request);
  if (!body || typeof body.id !== "number") {
    return NextResponse.json({ error: "Send a numeric id." }, { status: 400 });
  }
  await deleteLibraryItem(body.id);
  return NextResponse.json({ ok: true });
});
