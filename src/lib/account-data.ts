import { currentUserId } from "@/lib/auth/context";
import { queryRows, runStatement } from "@/lib/database";

const userTables = [
  "messages",
  "conversations",
  "todos",
  "approvals",
  "briefings",
  "usage",
  "bot_messages",
  "bot_memories",
  "bot_tasks",
  "bots",
  "notifications",
  "push_subscriptions",
  "google_tokens",
  "shared_chats",
  "user_memories",
  "user_settings",
  "user_timezones",
  "notes",
];

export async function exportAccountData(): Promise<Record<string, unknown[]>> {
  const userId = currentUserId();
  const exported: Record<string, unknown[]> = {};
  for (const table of userTables) {
    exported[table] = await queryRows(`SELECT * FROM ${table} WHERE user_id = ?`, [userId]);
  }
  return exported;
}

export async function deleteAccountData(): Promise<void> {
  const userId = currentUserId();
  for (const table of userTables) {
    await runStatement(`DELETE FROM ${table} WHERE user_id = ?`, [userId]);
  }
  await runStatement("DELETE FROM users WHERE id = ?", [userId]);
}

export async function searchChats(term: string): Promise<{ id: string; title: string; snippet: string }[]> {
  const userId = currentUserId();
  const pattern = `%${term.replace(/[%_]/g, (match) => `\\${match}`)}%`;
  return queryRows<{ id: string; title: string; snippet: string }>(
    `SELECT c.id AS id, c.title AS title,
            COALESCE((SELECT substr(m.content, 1, 120) FROM messages m
                      WHERE m.user_id = c.user_id AND m.conversation_id = c.id AND m.content LIKE ? ESCAPE '\\'
                      ORDER BY m.id DESC LIMIT 1), '') AS snippet
     FROM conversations c
     WHERE c.user_id = ? AND (c.title LIKE ? ESCAPE '\\' OR EXISTS (
       SELECT 1 FROM messages m WHERE m.user_id = c.user_id AND m.conversation_id = c.id AND m.content LIKE ? ESCAPE '\\'))
     ORDER BY c.updated_at DESC LIMIT 30`,
    [pattern, userId, pattern, pattern],
  );
}
