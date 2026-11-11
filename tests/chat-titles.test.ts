import { describe, expect, it } from "vitest";
import { runAsUser } from "@/lib/auth/context";
import { cleanTitle } from "@/lib/auto-title";
import { createConversation, listConversations, renameConversation, setAutoTitle, touchConversation } from "@/lib/conversations";
import { runStatement } from "@/lib/database";

const asUser = <T>(id: number, work: () => T) => runAsUser(id, "Asia/Dubai", work);

describe("new chat", () => {
  it("reuses the empty New chat instead of creating another one", async () => {
    const first = await asUser(61, () => createConversation());
    const second = await asUser(61, () => createConversation());
    const third = await asUser(61, () => createConversation());

    expect(second.id).toBe(first.id);
    expect(third.id).toBe(first.id);
    expect(await asUser(61, () => listConversations())).toHaveLength(1);
  });

  it("creates a fresh chat once the empty one has a message", async () => {
    const first = await asUser(62, () => createConversation());
    await runStatement("INSERT INTO messages (user_id, conversation_id, role, content) VALUES (62, ?, 'user', 'hello')", [first.id]);
    await asUser(62, () => touchConversation(first.id, "hello"));

    const next = await asUser(62, () => createConversation());

    expect(next.id).not.toBe(first.id);
    expect(await asUser(62, () => listConversations())).toHaveLength(2);
  });

  it("does not hand one account another account's empty chat", async () => {
    const mine = await asUser(63, () => createConversation());
    const theirs = await asUser(64, () => createConversation());

    expect(theirs.id).not.toBe(mine.id);
  });
});

describe("automatic chat names", () => {
  it("cleans a model title into a plain short name", () => {
    expect(cleanTitle('"Planning a Dubai trip."')).toBe("Planning a Dubai trip");
    expect(cleanTitle("**Fix build error**\nbecause the cache")).toBe("Fix build error");
    expect(cleanTitle("   ")).toBe("");
    expect(cleanTitle(null)).toBe("");
    expect(cleanTitle("x".repeat(100))).toHaveLength(60);
  });

  it("renames automatically until the user renames it by hand", async () => {
    const chat = await asUser(65, () => createConversation());
    await asUser(65, () => setAutoTitle(chat.id, "Dubai trip planning"));
    expect((await asUser(65, () => listConversations()))[0].title).toBe("Dubai trip planning");

    await asUser(65, () => renameConversation(chat.id, "My holiday"));
    await asUser(65, () => setAutoTitle(chat.id, "Something the model made up"));

    expect((await asUser(65, () => listConversations()))[0].title).toBe("My holiday");
  });
});
