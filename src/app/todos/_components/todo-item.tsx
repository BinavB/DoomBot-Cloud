"use client";

import { useState, type FormEvent } from "react";
import { Icon } from "@/components/icon";
import type { Todo } from "./todo-types";

interface TodoItemProps {
  todo: Todo;
  onToggle: (todo: Todo) => void;
  onRename: (todo: Todo, title: string) => Promise<boolean>;
  onDelete: (todo: Todo) => void;
}

const maxTitleLength = 200;

export function TodoItem({ todo, onToggle, onRename, onDelete }: TodoItemProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(todo.title);

  function startEditing() {
    setDraft(todo.title);
    setEditing(true);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = draft.trim();
    if (title.length === 0 || title === todo.title) {
      setEditing(false);
      return;
    }
    if (await onRename(todo, title)) {
      setEditing(false);
    }
  }

  if (editing) {
    return (
      <li className="px-3 py-2">
        <form onSubmit={save} className="flex items-center gap-2">
          <label htmlFor={`edit-${todo.id}`} className="sr-only">
            Edit task
          </label>
          <input
            id={`edit-${todo.id}`}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => event.key === "Escape" && setEditing(false)}
            maxLength={maxTitleLength}
            autoFocus
            className="h-10 min-w-0 flex-1 rounded-lg border border-doom bg-canvas px-3 text-sm outline-none"
          />
          <button type="submit" className="h-10 rounded-lg bg-doom px-3 text-sm font-semibold text-canvas">
            Save
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="h-10 rounded-lg px-3 text-sm text-muted hover:bg-raised hover:text-ink"
          >
            Cancel
          </button>
        </form>
      </li>
    );
  }

  return (
    <li className="group flex items-center gap-3 px-4 py-2.5">
      <input
        id={`todo-${todo.id}`}
        type="checkbox"
        checked={todo.done}
        onChange={() => onToggle(todo)}
        className="h-4 w-4 shrink-0 accent-[var(--doom)]"
      />
      <label
        htmlFor={`todo-${todo.id}`}
        className={`min-w-0 flex-1 break-words text-sm ${todo.done ? "text-muted line-through" : ""}`}
      >
        {todo.title}
      </label>
      <div className="flex shrink-0 items-center md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
        {!todo.done && (
          <button
            type="button"
            onClick={startEditing}
            aria-label={`Edit task: ${todo.title}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-raised hover:text-ink"
          >
            <Icon name="edit" size={18} />
          </button>
        )}
        <button
          type="button"
          onClick={() => onDelete(todo)}
          aria-label={`Delete task: ${todo.title}`}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-raised hover:text-danger"
        >
          <Icon name="close" size={18} />
        </button>
      </div>
    </li>
  );
}
