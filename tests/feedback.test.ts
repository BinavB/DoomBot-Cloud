import { describe, expect, it } from "vitest";
import { loadMessages } from "@/lib/agent/run";
import { runAsUser } from "@/lib/auth/context";
import { createConversation, deleteConversation } from "@/lib/conversations";
import { queryRow, runStatement } from "@/lib/database";
import { rateMessage } from "@/lib/feedback";

const zone = "Asia/Dubai";
const asUser = <T>(id: number, work: () => T) => runAsUser(id, zone, work);

async function addReply(userId: number, conversationId: string): Promise<number> {
  await runStatement("INSERT INTO messages (user_id, conversation_id, role, content) VALUES (?, ?, 'assistant', 'answer')", [
    userId,
    conversationId,
  ]);
  const row = await queryRow<{ id: number }>("SELECT MAX(id) AS id FROM messages WHERE user_id = ?", [userId]);
  return (row as { id: number }).id;
}

describe("message feedback", () => {
  it("saves, changes and clears a rating", async () => {
    const chat = await asUser(21, () => createConversation());
    const id = await addReply(21, chat.id);
    expect(await asUser(21, () => rateMessage(id, 1))).toBe(true);
    expect((await asUser(21, () => loadMessages(chat.id, 10)))[0].rating).toBe(1);
    await asUser(21, () => rateMessage(id, -1));
    expect((await asUser(21, () => loadMessages(chat.id, 10)))[0].rating).toBe(-1);
    await asUser(21, () => rateMessage(id, 0));
    expect((await asUser(21, () => loadMessages(chat.id, 10)))[0].rating).toBe(0);
  });

  it("does not let another account rate your reply", async () => {
    const chat = await asUser(22, () => createConversation());
    const id = await addReply(22, chat.id);
    expect(await asUser(23, () => rateMessage(id, 1))).toBe(false);
  });

  it("removes ratings when the chat is deleted", async () => {
    const chat = await asUser(24, () => createConversation());
    const id = await addReply(24, chat.id);
    await asUser(24, () => rateMessage(id, 1));
    await asUser(24, () => deleteConversation(chat.id));
    expect(await queryRow("SELECT rating FROM message_feedback WHERE message_id = ?", [id])).toBeUndefined();
  });
});
