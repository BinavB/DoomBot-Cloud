import { randomUUID } from "node:crypto";
import { currentUserId } from "@/lib/auth/context";
import { queryRow, queryRows, runStatement } from "@/lib/database";

export const legacyConversationId = "main";
export const defaultTitle = "New chat";
const titleLength = 60;

export interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
}

interface ConversationRow {
  id: string;
  title: string;
  updated_at: string;
}

function toConversation(row: ConversationRow): Conversation {
  return { id: row.id, title: row.title, updatedAt: row.updated_at };
}

const adoptedUsers = new Set<number>();

async function adoptLegacyConversation(userId: number): Promise<void> {
  if (adoptedUsers.has(userId)) {
    return;
  }
  await runStatement(
    `INSERT OR IGNORE INTO conversations (user_id, id, title)
     SELECT ?, ?, 'Earlier chat' WHERE EXISTS (SELECT 1 FROM messages WHERE user_id = ? AND conversation_id = ?)`,
    [userId, legacyConversationId, userId, legacyConversationId],
  );
  adoptedUsers.add(userId);
}

export async function listConversations(): Promise<Conversation[]> {
  const userId = currentUserId();
  await adoptLegacyConversation(userId);
  const rows = await queryRows<ConversationRow>(
    "SELECT id, title, updated_at FROM conversations WHERE user_id = ? ORDER BY updated_at DESC, id DESC LIMIT 100",
    [userId],
  );
  return rows.map(toConversation);
}

async function findEmptyConversation(userId: number): Promise<Conversation | undefined> {
  const row = await queryRow<ConversationRow>(
    `SELECT id, title, updated_at FROM conversations c
     WHERE c.user_id = ? AND c.title = ?
       AND NOT EXISTS (SELECT 1 FROM messages m WHERE m.user_id = c.user_id AND m.conversation_id = c.id)
       AND NOT EXISTS (SELECT 1 FROM shared_chats s WHERE s.user_id = c.user_id AND s.conversation_id = c.id)
     ORDER BY c.updated_at DESC LIMIT 1`,
    [userId, defaultTitle],
  );
  return row ? toConversation(row) : undefined;
}

export async function createConversation(): Promise<Conversation> {
  const empty = await findEmptyConversation(currentUserId());
  if (empty) {
    return empty;
  }
  const id = randomUUID();
  const row = await queryRow<ConversationRow>(
    "INSERT INTO conversations (user_id, id, title) VALUES (?, ?, ?) RETURNING id, title, updated_at",
    [currentUserId(), id, defaultTitle],
  );
  return toConversation(row as ConversationRow);
}

export async function ownsConversation(id: string): Promise<boolean> {
  const row = await queryRow<{ id: string }>("SELECT id FROM conversations WHERE user_id = ? AND id = ?", [
    currentUserId(),
    id,
  ]);
  return row !== undefined;
}

export async function renameConversation(id: string, title: string): Promise<void> {
  await runStatement("UPDATE conversations SET title = ?, title_locked = 1 WHERE user_id = ? AND id = ?", [
    title.trim().slice(0, titleLength),
    currentUserId(),
    id,
  ]);
}

export async function setAutoTitle(id: string, title: string): Promise<void> {
  await runStatement("UPDATE conversations SET title = ? WHERE user_id = ? AND id = ? AND title_locked = 0", [
    title.slice(0, titleLength),
    currentUserId(),
    id,
  ]);
}

export async function userMessageCount(id: string): Promise<number> {
  const row = await queryRow<{ total: number }>(
    "SELECT COUNT(*) AS total FROM messages WHERE user_id = ? AND conversation_id = ? AND role = 'user'",
    [currentUserId(), id],
  );
  return row?.total ?? 0;
}

export async function openingMessages(id: string, limit: number): Promise<{ role: string; content: string }[]> {
  return queryRows<{ role: string; content: string }>(
    "SELECT role, content FROM messages WHERE user_id = ? AND conversation_id = ? ORDER BY id ASC LIMIT ?",
    [currentUserId(), id, limit],
  );
}

export async function deleteConversation(id: string): Promise<void> {
  const userId = currentUserId();
  await runStatement("DELETE FROM shared_chats WHERE user_id = ? AND conversation_id = ?", [userId, id]);
  await runStatement(
    "DELETE FROM message_feedback WHERE user_id = ? AND message_id IN (SELECT id FROM messages WHERE user_id = ? AND conversation_id = ?)",
    [userId, userId, id],
  );
  await runStatement("DELETE FROM messages WHERE user_id = ? AND conversation_id = ?", [userId, id]);
  await runStatement("DELETE FROM conversations WHERE user_id = ? AND id = ?", [userId, id]);
}

export async function touchConversation(id: string, firstMessage?: string): Promise<void> {
  const userId = currentUserId();
  await runStatement("UPDATE conversations SET updated_at = datetime('now') WHERE user_id = ? AND id = ?", [userId, id]);
  if (firstMessage !== undefined) {
    await runStatement(
      "UPDATE conversations SET title = ? WHERE user_id = ? AND id = ? AND title = ?",
      [firstMessage.replace(/\s+/g, " ").trim().slice(0, titleLength) || defaultTitle, userId, id, defaultTitle],
    );
  }
}
