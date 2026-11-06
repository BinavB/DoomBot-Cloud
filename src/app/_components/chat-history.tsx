"use client";

import { useRef, useState } from "react";
import { Icon } from "@/components/icon";
import type { Conversation } from "@/lib/conversations";

interface ChatHistoryProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onShare: (id: string) => void;
}

const rowButton = "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-raised hover:text-ink";

export function ChatHistory({ conversations, selectedId, onSelect, onNew, onRename, onDelete, onShare }: ChatHistoryProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ id: string; title: string; snippet: string }[] | null>(null);
  const searchSeq = useRef(0);

  function search(term: string) {
    setQuery(term);
    const sequence = ++searchSeq.current;
    if (term.trim().length < 2) {
      setResults(null);
      return;
    }
    fetch(`/api/search?q=${encodeURIComponent(term.trim())}`)
      .then((response) => response.json() as Promise<{ results: { id: string; title: string; snippet: string }[] }>)
      .then((data) => {
        if (sequence === searchSeq.current) {
          setResults(data.results);
        }
      })
      .catch(() => {
        if (sequence === searchSeq.current) {
          setResults([]);
        }
      });
  }

  function startEditing(conversation: Conversation) {
    setEditingId(conversation.id);
    setDraft(conversation.title);
  }

  function finishEditing(id: string) {
    const title = draft.trim();
    setEditingId(null);
    if (title.length > 0) {
      onRename(id, title);
    }
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <button
        type="button"
        onClick={onNew}
        className="flex h-10 items-center justify-center gap-2 rounded-xl border border-line text-sm font-medium hover:bg-raised"
      >
        <Icon name="edit_square" size={18} />
        New chat
      </button>
      <input
        type="search"
        value={query}
        onChange={(event) => search(event.target.value)}
        placeholder="Search chats"
        aria-label="Search chats"
        className="h-9 rounded-xl border border-line bg-transparent px-3 text-sm outline-none placeholder:text-muted focus:border-doom"
      />
      {results !== null && (
        <ul className="flex flex-col gap-1" aria-label="Search results">
          {results.length === 0 && <li className="px-3 py-2 text-sm text-muted">No chats match.</li>}
          {results.map((result) => (
            <li key={result.id}>
              <button
                type="button"
                onClick={() => {
                  onSelect(result.id);
                  search("");
                }}
                className="flex w-full flex-col rounded-xl px-3 py-2 text-left hover:bg-raised"
              >
                <span className="truncate text-sm font-medium">{result.title}</span>
                {result.snippet && <span className="truncate text-xs text-muted">{result.snippet}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
      <ul className={`flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto ${results !== null ? "hidden" : ""}`} aria-label="Chats">
        {conversations.map((conversation) => {
          const active = conversation.id === selectedId;
          return (
            <li
              key={conversation.id}
              className={`flex items-center gap-1 rounded-xl pr-1 ${active ? "bg-raised" : "hover:bg-raised"}`}
            >
              {editingId === conversation.id ? (
                <input
                  autoFocus
                  value={draft}
                  maxLength={60}
                  onChange={(event) => setDraft(event.target.value)}
                  onBlur={() => finishEditing(conversation.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.currentTarget.blur();
                    }
                    if (event.key === "Escape") {
                      setEditingId(null);
                    }
                  }}
                  aria-label="Chat name"
                  className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => onSelect(conversation.id)}
                  aria-current={active ? "true" : undefined}
                  className={`min-w-0 flex-1 truncate px-3 py-2 text-left text-sm ${active ? "font-medium text-ink" : "text-muted"}`}
                >
                  {conversation.title}
                </button>
              )}
              {editingId !== conversation.id && (
                <>
                  <button type="button" onClick={() => onShare(conversation.id)} aria-label="Share chat" className={rowButton}>
                    <Icon name="share" size={16} />
                  </button>
                  <button type="button" onClick={() => startEditing(conversation)} aria-label="Rename chat" className={rowButton}>
                    <Icon name="edit" size={16} />
                  </button>
                  <button type="button" onClick={() => onDelete(conversation.id)} aria-label="Delete chat" className={rowButton}>
                    <Icon name="delete" size={16} />
                  </button>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
