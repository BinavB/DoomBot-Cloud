import { currentUserId } from "@/lib/auth/context";
import { queryRow, queryRows, runStatement } from "@/lib/database";

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

export async function setTodoDone(id: number, done: boolean): Promise<void> {
  await runStatement("UPDATE todos SET done = ? WHERE id = ? AND user_id = ?", [done ? 1 : 0, id, currentUserId()]);
}

export async function deleteTodo(id: number): Promise<void> {
  await runStatement("DELETE FROM todos WHERE id = ? AND user_id = ?", [id, currentUserId()]);
}
