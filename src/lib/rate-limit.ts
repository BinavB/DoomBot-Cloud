import { queryRow, runStatement } from "@/lib/database";

export const windowMilliseconds = 60_000;
export const maxRequestsPerWindow = 20;
const keepWindows = 5;

export async function takeChatSlot(userId: number, now: number = Date.now()): Promise<boolean> {
  const windowStart = Math.floor(now / windowMilliseconds);
  const row = await queryRow<{ hits: number }>(
    `INSERT INTO rate_limits (user_id, window_start, hits) VALUES (?, ?, 1)
     ON CONFLICT(user_id, window_start) DO UPDATE SET hits = hits + 1
     RETURNING hits`,
    [userId, windowStart],
  );
  if (windowStart % keepWindows === 0) {
    await runStatement("DELETE FROM rate_limits WHERE window_start < ?", [windowStart - keepWindows]);
  }
  return (row?.hits ?? 1) <= maxRequestsPerWindow;
}
