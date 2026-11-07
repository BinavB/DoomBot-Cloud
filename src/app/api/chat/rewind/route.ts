import { NextResponse } from "next/server";
import { withUser } from "@/lib/auth/route";
import { readBody } from "@/lib/http";
import { ownsConversation } from "@/lib/conversations";
import { runStatement } from "@/lib/database";
import { currentUserId } from "@/lib/auth/context";

const conversationIdPattern = /^[0-9a-f-]{36}$|^main$/;

export const POST = withUser(async (request: Request) => {
  const body = (await readBody<{ conversationId?: unknown; messageId?: unknown }>(request)) ?? {};
  if (typeof body.conversationId !== "string" || !conversationIdPattern.test(body.conversationId)) {
    return NextResponse.json({ error: "That chat does not exist." }, { status: 404 });
  }
  if (typeof body.messageId !== "number" || !Number.isInteger(body.messageId) || body.messageId <= 0) {
    return NextResponse.json({ error: "Send a numeric messageId." }, { status: 400 });
  }
  if (!(await ownsConversation(body.conversationId))) {
    return NextResponse.json({ error: "That chat does not exist." }, { status: 404 });
  }
  await runStatement(
    "DELETE FROM message_feedback WHERE user_id = ? AND message_id IN (SELECT id FROM messages WHERE user_id = ? AND conversation_id = ? AND id >= ?)",
    [currentUserId(), currentUserId(), body.conversationId, body.messageId],
  );
  await runStatement("DELETE FROM messages WHERE user_id = ? AND conversation_id = ? AND id >= ?", [
    currentUserId(),
    body.conversationId,
    body.messageId,
  ]);
  return NextResponse.json({ ok: true });
});
