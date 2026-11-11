"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { PageNotice } from "@/components/page-notice";
import { Icon } from "@/components/icon";
import { TodoItem } from "./todo-item";
import { jsonHeaders, type Todo } from "./todo-types";

const refreshMilliseconds = 15000;

function sortTodos(todos: Todo[]): Todo[] {
  return [...todos].sort((first, second) => Number(first.done) - Number(second.done) || first.id - second.id);
}

export function TodoView() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch("/api/todos")
      .then((response) => response.json() as Promise<{ todos: Todo[] }>)
      .then((data) => setTodos(data.todos))
      .catch(() => setError("Your to-do list could not load. Reload the page to try again."))
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(() => {
      if (!document.hidden) {
        load();
      }
    }, refreshMilliseconds);
    window.addEventListener("focus", load);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", load);
    };
  }, [load]);

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const newTitle = title.trim();
    if (newTitle.length === 0) {
      return;
    }
    setTitle("");
    const response = await fetch("/api/todos", { method: "POST", headers: jsonHeaders, body: JSON.stringify({ title: newTitle }) });
    const data = (await response.json()) as { todo?: Todo; error?: string };
    if (!response.ok || !data.todo) {
      setError(data.error ?? "The task could not be added.");
      setTitle((current) => current || newTitle);
      return;
    }
    const todo = data.todo;
    setTodos((current) => sortTodos([...current, todo]));
    setError(null);
  }

  async function update(todo: Todo, change: Partial<Pick<Todo, "title" | "done">>): Promise<boolean> {
    const response = await fetch("/api/todos", { method: "PATCH", headers: jsonHeaders, body: JSON.stringify({ id: todo.id, ...change }) });
    const data = (await response.json()) as { todo?: Todo; error?: string };
    if (!response.ok || !data.todo) {
      setError(data.error ?? "The task could not be changed.");
      load();
      return false;
    }
    const updated = data.todo;
    setTodos((current) => sortTodos(current.map((item) => (item.id === updated.id ? updated : item))));
    setError(null);
    return true;
  }

  async function remove(todo: Todo) {
    setTodos((current) => current.filter((item) => item.id !== todo.id));
    const response = await fetch("/api/todos", { method: "DELETE", headers: jsonHeaders, body: JSON.stringify({ id: todo.id }) });
    if (!response.ok && response.status !== 404) {
      setError("The task could not be deleted.");
      load();
    }
  }

  async function clearDone() {
    const response = await fetch("/api/todos", { method: "DELETE", headers: jsonHeaders, body: JSON.stringify({ done: true }) });
    if (!response.ok) {
      setError("Finished tasks could not be cleared.");
      return;
    }
    setTodos((current) => current.filter((item) => !item.done));
  }

  const open = todos.filter((todo) => !todo.done);
  const done = todos.filter((todo) => todo.done);
  const itemHandlers = {
    onToggle: (todo: Todo) => void update(todo, { done: !todo.done }),
    onRename: (todo: Todo, newTitle: string) => update(todo, { title: newTitle }),
    onDelete: (todo: Todo) => void remove(todo),
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 md:px-6">
      <form onSubmit={add} className="flex gap-2">
        <label htmlFor="new-task" className="sr-only">
          New task
        </label>
        <input
          id="new-task"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Add a task"
          maxLength={200}
          className="h-11 flex-1 rounded-xl border border-line bg-panel px-4 outline-none placeholder:text-muted focus:border-doom"
        />
        <button
          type="submit"
          disabled={title.trim().length === 0}
          className="flex h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl bg-doom px-4 text-sm font-semibold text-canvas disabled:opacity-40 sm:px-5"
        >
          <Icon name="add" size={18} />
          Add
        </button>
      </form>

      {error && <PageNotice tone="error">{error}</PageNotice>}

      {loaded && todos.length === 0 && !error && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line px-6 py-10 text-center">
          <Icon name="task_alt" size={32} className="text-doom" />
          <p className="font-medium">Nothing on your list</p>
          <p className="max-w-sm text-sm text-muted">
            Add a task above, or ask in chat, like &quot;add renew passport to my list&quot;. Your Doombots can add, change and tick off tasks too.
          </p>
        </div>
      )}

      {open.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-muted">{open.length === 1 ? "1 open task" : `${open.length} open tasks`}</h2>
          <ul className="divide-y divide-line rounded-2xl border border-line bg-panel">
            {open.map((todo) => (
              <TodoItem key={todo.id} todo={todo} {...itemHandlers} />
            ))}
          </ul>
        </section>
      )}

      {done.length > 0 && (
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-medium text-muted">{done.length === 1 ? "1 finished" : `${done.length} finished`}</h2>
            <button
              type="button"
              onClick={() => void clearDone()}
              className="rounded-lg px-2 py-1 text-sm text-muted hover:bg-raised hover:text-danger"
            >
              Clear finished
            </button>
          </div>
          <ul className="divide-y divide-line rounded-2xl border border-line bg-panel/60">
            {done.map((todo) => (
              <TodoItem key={todo.id} todo={todo} {...itemHandlers} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
