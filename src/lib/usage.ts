import { currentUserId } from "@/lib/auth/context";
import { queryRow, runStatement } from "@/lib/database";
import { currentDay } from "@/lib/time";

export async function recordUsage(model: string, promptTokens: number, completionTokens: number): Promise<void> {
  await runStatement(
    "INSERT INTO usage (user_id, day, model, prompt_tokens, completion_tokens) VALUES (?, ?, ?, ?, ?)",
    [currentUserId(), currentDay(), model, promptTokens, completionTokens],
  );
}

export async function tokensUsedToday(): Promise<number> {
  const row = await queryRow<{ total: number }>(
    "SELECT COALESCE(SUM(prompt_tokens + completion_tokens), 0) AS total FROM usage WHERE user_id = ? AND day = ?",
    [currentUserId(), currentDay()],
  );
  return row?.total ?? 0;
}
