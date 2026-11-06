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

async function adoptLegacyConversation(userId: number): Promise<void> {
  await runStatement(
    `INSERT OR IGNORE INTO conversations (user_id, id, title)
     SELECT ?, ?, 'Earlier chat' WHERE EXISTS (SELECT 1 FROM messages WHERE user_id = ? AND conversation_id = ?)`,
    [userId, legacyConversationId, userId, legacyConversationId],
  );
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

export async function createConversation(): Promise<Conversation> {
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
  await runStatement("UPDATE conversations SET title = ? WHERE user_id = ? AND id = ?", [
    title.trim().slice(0, titleLength),
    currentUserId(),
    id,
  ]);
}

export async function deleteConversation(id: string): Promise<void> {
  const userId = currentUserId();
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
