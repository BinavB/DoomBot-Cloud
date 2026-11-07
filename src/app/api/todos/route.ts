import { NextResponse } from "next/server";
import { addTodo, clearDoneTodos, deleteTodo, listTodos, maxTodoTitleLength, updateTodo, type TodoChange } from "@/lib/todos";
import { withUser } from "@/lib/auth/route";

function readTitle(value: unknown): string | null {
  const title = typeof value === "string" ? value.trim() : "";
  return title.length === 0 || title.length > maxTodoTitleLength ? null : title;
}

export const GET = withUser(async () => {
  return NextResponse.json({ todos: await listTodos() });
});

export const POST = withUser(async (request: Request) => {
  const body = (await request.json()) as { title?: unknown };
  const title = readTitle(body.title);
  if (title === null) {
    return NextResponse.json({ error: `Enter a title up to ${maxTodoTitleLength} characters.` }, { status: 400 });
  }
  return NextResponse.json({ todo: await addTodo(title) }, { status: 201 });
});

export const PATCH = withUser(async (request: Request) => {
  const body = (await request.json()) as { id?: unknown; done?: unknown; title?: unknown };
  if (typeof body.id !== "number") {
    return NextResponse.json({ error: "Send a numeric id." }, { status: 400 });
  }
  const change: TodoChange = {};
  if (body.title !== undefined) {
    const title = readTitle(body.title);
    if (title === null) {
      return NextResponse.json({ error: `Enter a title up to ${maxTodoTitleLength} characters.` }, { status: 400 });
    }
    change.title = title;
  }
  if (body.done !== undefined) {
    if (typeof body.done !== "boolean") {
      return NextResponse.json({ error: "Send done as true or false." }, { status: 400 });
    }
    change.done = body.done;
  }
  const todo = await updateTodo(body.id, change);
  if (!todo) {
    return NextResponse.json({ error: "That task does not exist." }, { status: 404 });
  }
  return NextResponse.json({ todo });
});

export const DELETE = withUser(async (request: Request) => {
  const body = (await request.json()) as { id?: unknown; done?: unknown };
  if (body.done === true) {
    return NextResponse.json({ cleared: await clearDoneTodos() });
  }
  if (typeof body.id !== "number") {
    return NextResponse.json({ error: "Send a numeric id, or done set to true." }, { status: 400 });
  }
  if (!(await deleteTodo(body.id))) {
    return NextResponse.json({ error: "That task does not exist." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
});
