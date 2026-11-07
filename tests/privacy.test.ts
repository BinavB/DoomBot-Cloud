import { describe, expect, it } from "vitest";
import { searchChats } from "@/lib/account-data";
import { runAsUser } from "@/lib/auth/context";
import { createConversation, deleteConversation, listConversations, ownsConversation } from "@/lib/conversations";
import { queryRow, runStatement } from "@/lib/database";
import { createShare, readSharedChat, revokeShare } from "@/lib/sharing";
import { addTodo, listTodos } from "@/lib/todos";

const zone = "Asia/Dubai";
const asAlice = <T>(work: () => T) => runAsUser(1, zone, work);
const asBob = <T>(work: () => T) => runAsUser(2, zone, work);

async function addMessage(userId: number, conversationId: string, text: string) {
  await runStatement("INSERT INTO messages (user_id, conversation_id, role, content) VALUES (?, ?, 'user', ?)", [
    userId,
    conversationId,
    text,
  ]);
}

describe("account privacy", () => {
  it("keeps to-dos separate", async () => {
    await asAlice(() => addTodo("alice private"));
    expect(await asBob(() => listTodos())).toEqual([]);
    expect((await asAlice(() => listTodos())).map((todo) => todo.title)).toEqual(["alice private"]);
  });

  it("does not let another account own or list a chat", async () => {
    const chat = await asAlice(() => createConversation());
    expect(await asBob(() => ownsConversation(chat.id))).toBe(false);
    expect(await asBob(() => listConversations())).toEqual([]);
  });

  it("searches only your own chats", async () => {
    const chat = await asAlice(() => createConversation());
    await addMessage(1, chat.id, "passport renewal question");
    expect((await asAlice(() => searchChats("passport"))).length).toBe(1);
    expect(await asBob(() => searchChats("passport"))).toEqual([]);
  });

  it("serves a shared chat only until sharing stops", async () => {
    const chat = await asAlice(() => createConversation());
    await addMessage(1, chat.id, "shared hello");
    const token = await asAlice(() => createShare(chat.id));
    expect((await readSharedChat(token))?.messages[0].content).toBe("shared hello");
    await asAlice(() => revokeShare(chat.id));
    expect(await readSharedChat(token)).toBeNull();
  });

  it("revokes the share link when the chat is deleted", async () => {
    const chat = await asAlice(() => createConversation());
    const token = await asAlice(() => createShare(chat.id));
    await asAlice(() => deleteConversation(chat.id));
    expect(await readSharedChat(token)).toBeNull();
    const row = await queryRow("SELECT token FROM shared_chats WHERE token = ?", [token]);
    expect(row).toBeUndefined();
  });
});

describe("share expiry", () => {
  it("stops serving a link after 30 days", async () => {
    const chat = await asAlice(() => createConversation());
    const token = await asAlice(() => createShare(chat.id));
    await runStatement("UPDATE shared_chats SET created_at = datetime('now', '-31 days') WHERE token = ?", [token]);
    expect(await readSharedChat(token)).toBeNull();
  });
});
