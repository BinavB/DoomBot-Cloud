import { describe, expect, it, vi } from "vitest";
import { findTool, botAllowedToolInfos } from "@/lib/agent/tools";
import { runAsUser } from "@/lib/auth/context";
import { runStatement } from "@/lib/database";
import { clearNotifications, deleteNotification, listNotifications } from "@/lib/notifications";
import { addTodo, clearDoneTodos, deleteTodo, listTodos, updateTodo } from "@/lib/todos";

vi.mock("@/lib/push", () => ({ sendPushToCurrentUser: async () => undefined }));

const zone = "Asia/Dubai";
const asCarol = <T>(work: () => T) => runAsUser(31, zone, work);
const asDan = <T>(work: () => T) => runAsUser(32, zone, work);

async function addAlert(userId: number, title: string) {
  await runStatement("INSERT INTO notifications (user_id, bot_id, title, body, urgent) VALUES (?, NULL, ?, '', 0)", [userId, title]);
}

describe("to-dos", () => {
  it("renames, ticks off and deletes only your own tasks", async () => {
    const todo = await asCarol(() => addTodo("buy milk"));
    expect(await asDan(() => updateTodo(todo.id, { done: true }))).toBeNull();
    expect(await asDan(() => deleteTodo(todo.id))).toBe(false);
    const renamed = await asCarol(() => updateTodo(todo.id, { title: "buy oat milk", done: true }));
    expect(renamed).toEqual({ id: todo.id, title: "buy oat milk", done: true });
    expect(await asCarol(() => deleteTodo(todo.id))).toBe(true);
  });

  it("clears only finished tasks", async () => {
    const open = await asCarol(() => addTodo("still open"));
    const finished = await asCarol(() => addTodo("finished"));
    await asCarol(() => updateTodo(finished.id, { done: true }));
    expect(await asCarol(() => clearDoneTodos())).toBe(1);
    expect((await asCarol(() => listTodos())).map((todo) => todo.id)).toContain(open.id);
  });

  it("lets Doombots add and update tasks, and makes deletes wait for approval", async () => {
    const allowed = botAllowedToolInfos().map((tool) => tool.name);
    expect(allowed).toEqual(expect.arrayContaining(["add_todo", "update_todo"]));
    expect(allowed).not.toContain("delete_todo");
    expect(findTool("delete_todo")?.requiresApproval).toBe(true);
    const todo = await asCarol(() => addTodo("call the bank"));
    await asCarol(() => findTool("update_todo")!.run({ todo_id: todo.id, done: true }));
    expect((await asCarol(() => listTodos())).find((item) => item.id === todo.id)?.done).toBe(true);
    await asCarol(() => findTool("delete_todo")!.run({ todo_id: todo.id }));
    expect((await asCarol(() => listTodos())).some((item) => item.id === todo.id)).toBe(false);
  });
});

describe("alerts", () => {
  it("deletes one alert or clears all, only for the owner", async () => {
    await addAlert(31, "first");
    await addAlert(31, "second");
    await addAlert(32, "dan's alert");
    const [newest] = await asCarol(() => listNotifications());
    expect(await asDan(() => deleteNotification(newest.id))).toBe(false);
    expect(await asCarol(() => deleteNotification(newest.id))).toBe(true);
    await asCarol(() => clearNotifications());
    expect(await asCarol(() => listNotifications())).toEqual([]);
    expect((await asDan(() => listNotifications())).length).toBe(1);
  });
});
