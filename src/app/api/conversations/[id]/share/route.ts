import { NextResponse } from "next/server";
import { withUser } from "@/lib/auth/route";
import { ownsConversation } from "@/lib/conversations";
import { createShare, revokeShare } from "@/lib/sharing";

export const POST = withUser(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  if (!(await ownsConversation(id))) {
    return NextResponse.json({ error: "That chat does not exist." }, { status: 404 });
  }
  return NextResponse.json({ token: await createShare(id) });
});

export const DELETE = withUser(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  if (!(await ownsConversation(id))) {
    return NextResponse.json({ error: "That chat does not exist." }, { status: 404 });
  }
  await revokeShare(id);
  return NextResponse.json({ ok: true });
});
