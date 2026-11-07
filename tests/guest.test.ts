import { describe, expect, it } from "vitest";
import { runAsUser } from "@/lib/auth/context";
import { claimGuestAccount, createGuestUser } from "@/lib/auth/guest";
import { findSession, findUser, listActiveUsers, upsertGoogleUser } from "@/lib/auth/users";
import { createConversation, listConversations } from "@/lib/conversations";
import { queryRow } from "@/lib/database";
import { addTodo, listTodos } from "@/lib/todos";

const zone = "Asia/Dubai";

function profile(sub: string) {
  return { sub, email: `${sub}@example.com`, name: `User ${sub}`, picture: null };
}

describe("guest accounts", () => {
  it("creates a guest that is marked as a guest", async () => {
    const { user, sessionVersion } = await createGuestUser();
    expect(user.guest).toBe(true);
    expect((await findSession(user.id, sessionVersion))?.user.guest).toBe(true);
    expect((await findUser(user.id))?.guest).toBe(true);
  });

  it("leaves guests out of scheduled work", async () => {
    const { user } = await createGuestUser();
    expect((await listActiveUsers()).some((active) => active.id === user.id)).toBe(false);
  });

  it("turns a guest into a Google account and keeps its chats", async () => {
    const { user } = await createGuestUser();
    const chat = await runAsUser(user.id, zone, () => createConversation());
    const signedIn = await claimGuestAccount(user.id, profile("new-person"));
    expect(signedIn.user.id).toBe(user.id);
    expect(signedIn.user.guest).toBe(false);
    expect((await runAsUser(user.id, zone, () => listConversations())).map((item) => item.id)).toContain(chat.id);
  });

  it("moves guest chats and to-dos into an existing Google account", async () => {
    const existing = await upsertGoogleUser(profile("returning-person"));
    const { user } = await createGuestUser();
    const chat = await runAsUser(user.id, zone, () => createConversation());
    await runAsUser(user.id, zone, () => addTodo("guest task"));
    const signedIn = await claimGuestAccount(user.id, profile("returning-person"));
    expect(signedIn.user.id).toBe(existing.user.id);
    const owner = existing.user.id;
    expect((await runAsUser(owner, zone, () => listConversations())).map((item) => item.id)).toContain(chat.id);
    expect((await runAsUser(owner, zone, () => listTodos())).map((todo) => todo.title)).toContain("guest task");
    expect(await queryRow("SELECT id FROM users WHERE id = ?", [user.id])).toBeUndefined();
  });
});
