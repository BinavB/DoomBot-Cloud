import { currentUserId } from "@/lib/auth/context";
import { queryRow, queryRows } from "@/lib/database";

export interface Todo {
  id: number;
  title: string;
  done: boolean;
}

interface TodoRow {
  id: number;
  title: string;
  done: number;
}

function toTodo(row: TodoRow): Todo {
  return { id: row.id, title: row.title, done: row.done === 1 };
}

export async function listTodos(): Promise<Todo[]> {
  const rows = await queryRows<TodoRow>("SELECT id, title, done FROM todos WHERE user_id = ? ORDER BY done, id", [
    currentUserId(),
  ]);
  return rows.map(toTodo);
}

export async function addTodo(title: string): Promise<Todo> {
  const row = await queryRow<TodoRow>("INSERT INTO todos (user_id, title) VALUES (?, ?) RETURNING id, title, done", [
    currentUserId(),
    title,
  ]);
  return toTodo(row as TodoRow);
}

export const maxTodoTitleLength = 200;

export interface TodoChange {
  title?: string;
  done?: boolean;
}

export async function updateTodo(id: number, change: TodoChange): Promise<Todo | null> {
  const row = await queryRow<TodoRow>(
    `UPDATE todos SET title = COALESCE(?, title), done = COALESCE(?, done)
     WHERE id = ? AND user_id = ? RETURNING id, title, done`,
    [change.title ?? null, change.done === undefined ? null : change.done ? 1 : 0, id, currentUserId()],
  );
  return row ? toTodo(row) : null;
}

export async function deleteTodo(id: number): Promise<boolean> {
  const row = await queryRow<{ id: number }>("DELETE FROM todos WHERE id = ? AND user_id = ? RETURNING id", [id, currentUserId()]);
  return row !== undefined;
}

export async function clearDoneTodos(): Promise<number> {
  const rows = await queryRows<{ id: number }>("DELETE FROM todos WHERE user_id = ? AND done = 1 RETURNING id", [currentUserId()]);
  return rows.length;
}
