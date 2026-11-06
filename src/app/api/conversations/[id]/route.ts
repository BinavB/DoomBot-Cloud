import { NextResponse } from "next/server";
import { withUser } from "@/lib/auth/route";
import { deleteConversation, ownsConversation, renameConversation } from "@/lib/conversations";

export const PATCH = withUser(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  if (!(await ownsConversation(id))) {
    return NextResponse.json({ error: "That chat does not exist." }, { status: 404 });
  }
  const body = (await request.json()) as { title?: unknown };
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (title.length === 0) {
    return NextResponse.json({ error: "Give the chat a name." }, { status: 400 });
  }
  await renameConversation(id, title);
  return NextResponse.json({ ok: true });
});

export const DELETE = withUser(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  if (!(await ownsConversation(id))) {
    return NextResponse.json({ error: "That chat does not exist." }, { status: 404 });
  }
  await deleteConversation(id);
  return NextResponse.json({ ok: true });
});
