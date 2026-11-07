import { currentUserId } from "@/lib/auth/context";
import { queryRow, runStatement } from "@/lib/database";

export type Rating = -1 | 0 | 1;

export function isRating(value: unknown): value is Rating {
  return value === -1 || value === 0 || value === 1;
}

export async function rateMessage(messageId: number, rating: Rating): Promise<boolean> {
  const userId = currentUserId();
  const owned = await queryRow<{ id: number }>(
    "SELECT id FROM messages WHERE id = ? AND user_id = ? AND role = 'assistant'",
    [messageId, userId],
  );
  if (!owned) {
    return false;
  }
  if (rating === 0) {
    await runStatement("DELETE FROM message_feedback WHERE user_id = ? AND message_id = ?", [userId, messageId]);
    return true;
  }
  await runStatement(
    `INSERT INTO message_feedback (user_id, message_id, rating) VALUES (?, ?, ?)
     ON CONFLICT(user_id, message_id) DO UPDATE SET rating = excluded.rating`,
    [userId, messageId, rating],
  );
  return true;
}
