import { randomBytes } from "node:crypto";
import { currentUserId } from "@/lib/auth/context";
import { queryRow, queryRows, runStatement } from "@/lib/database";

export interface SharedChat {
  title: string;
  messages: { role: "user" | "assistant"; content: string }[];
}

const tokenPattern = /^[A-Za-z0-9_-]{20,64}$/;

export function isShareToken(value: string): boolean {
  return tokenPattern.test(value);
}

export async function createShare(conversationId: string): Promise<string> {
  const userId = currentUserId();
  const existing = await queryRow<{ token: string }>(
    "SELECT token FROM shared_chats WHERE user_id = ? AND conversation_id = ?",
    [userId, conversationId],
  );
  if (existing) {
    return existing.token;
  }
  const token = randomBytes(24).toString("base64url");
  await runStatement("INSERT INTO shared_chats (token, user_id, conversation_id) VALUES (?, ?, ?)", [
    token,
    userId,
    conversationId,
  ]);
  return token;
}

export async function revokeShare(conversationId: string): Promise<void> {
  await runStatement("DELETE FROM shared_chats WHERE user_id = ? AND conversation_id = ?", [
    currentUserId(),
    conversationId,
  ]);
}

export async function readSharedChat(token: string): Promise<SharedChat | null> {
  const share = await queryRow<{ user_id: number; conversation_id: string }>(
    "SELECT user_id, conversation_id FROM shared_chats WHERE token = ?",
    [token],
  );
  if (!share) {
    return null;
  }
  const conversation = await queryRow<{ title: string }>(
    "SELECT title FROM conversations WHERE user_id = ? AND id = ?",
    [share.user_id, share.conversation_id],
  );
  if (!conversation) {
    return null;
  }
  const messages = await queryRows<{ role: "user" | "assistant"; content: string }>(
    "SELECT role, content FROM messages WHERE user_id = ? AND conversation_id = ? ORDER BY id LIMIT 500",
    [share.user_id, share.conversation_id],
  );
  return { title: conversation.title, messages };
}
