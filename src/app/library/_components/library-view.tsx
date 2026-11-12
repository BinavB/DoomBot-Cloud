"use client";

import { useEffect, useState } from "react";
import { Markdown } from "@/components/markdown";
import { PageNotice } from "@/components/page-notice";
import type { LibraryItem } from "@/lib/library";

function formatDate(value: string): string {
  return new Date(`${value.replace(" ", "T")}Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function LibraryView() {
  const [items, setItems] = useState<LibraryItem[] | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/library")
      .then((response) => response.json() as Promise<{ items: LibraryItem[] }>)
      .then((data) => setItems(data.items))
      .catch(() => setError("The Library could not load. Reload the page to try again."));
  }, []);

  async function remove(id: number) {
    const response = await fetch("/api/library", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!response.ok) {
      setError("That item could not be deleted. Try again.");
      return;
    }
    setItems((current) => (current ? current.filter((item) => item.id !== id) : current));
    setOpenId(null);
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-8 md:px-6">
      <p className="text-sm text-muted">Notes and files DOOMBOT saved for you. Only you can see them.</p>
      {error && <PageNotice tone="error">{error}</PageNotice>}
      {items && items.length === 0 && <p className="text-muted">Nothing saved yet. Ask DOOMBOT to save a note.</p>}
      <ul className="flex flex-col gap-3">
        {items?.map((item) => {
          const open = openId === item.id;
          return (
            <li key={item.id} className="flex flex-col gap-3 rounded-2xl border border-line bg-panel p-5">
              <button
                type="button"
                onClick={() => setOpenId(open ? null : item.id)}
                aria-expanded={open}
                className="flex items-start justify-between gap-3 text-left"
              >
                <span className="font-semibold">{item.title}</span>
                <span className="shrink-0 text-xs text-muted">{formatDate(item.createdAt)}</span>
              </button>
              {open ? (
                <>
                  <Markdown text={item.body} />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => void remove(item.id)}
                      className="rounded-lg px-3 py-1.5 text-sm text-muted hover:bg-raised hover:text-danger"
                    >
                      Delete
                    </button>
                  </div>
                </>
              ) : (
                <p className="line-clamp-2 text-sm text-muted">{item.body}</p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
