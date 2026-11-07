"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { chatMenuItems } from "@/components/chat-menu-items";
import { createChat, selectChat, startChats, useChatState } from "@/components/chat-store";
import { Icon } from "@/components/icon";
import { Menu } from "@/components/menu";
import { groupByDate } from "@/lib/conversation-groups";

interface SearchResult {
  id: string;
  title: string;
  snippet: string;
}

const searchDelayMilliseconds = 250;

function noopSubscribe(): () => void {
  return () => undefined;
}

interface SidebarChatsProps {
  onNavigate?: () => void;
  pages?: ReactNode;
}

export function SidebarChats({ onNavigate, pages }: SidebarChatsProps) {
  const { conversations, selectedId, ready } = useChatState();
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const sequence = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    startChats();
  }, []);

  function open(id: string) {
    selectChat(id);
    onNavigate?.();
    if (pathname !== "/") {
      router.push("/");
    }
  }

  const onChatPage = pathname === "/";

  async function handlePrimary() {
    if (onChatPage) {
      await createChat();
    }
    onNavigate?.();
    if (!onChatPage) {
      router.push("/");
    }
  }

  function search(term: string) {
    setQuery(term);
    const current = ++sequence.current;
    if (timer.current) {
      clearTimeout(timer.current);
    }
    if (term.trim().length < 2) {
      setResults(null);
      return;
    }
    timer.current = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(term.trim())}`)
        .then((response) => response.json() as Promise<{ results: SearchResult[] }>)
        .then((data) => current === sequence.current && setResults(data.results))
        .catch(() => current === sequence.current && setResults([]));
    }, searchDelayMilliseconds);
  }

  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const groups = mounted ? groupByDate(conversations, new Date()) : [];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <button
        type="button"
        data-tour="sidebar-new"
        onClick={() => void handlePrimary()}
        className="flex h-10 items-center gap-2 rounded-xl border border-line px-3 text-sm font-medium hover:bg-raised"
      >
        <Icon name={onChatPage ? "edit_square" : "chat"} size={18} />
        {onChatPage ? "New chat" : "Chat"}
      </button>
      {pages}
      <input
        data-tour="sidebar-search"
        type="search"
        value={query}
        onChange={(event) => search(event.target.value)}
        placeholder="Search chats"
        aria-label="Search chats"
        className="h-9 rounded-xl border border-line bg-transparent px-3 text-sm outline-none placeholder:text-muted focus:border-doom"
      />
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-1" aria-label="Chats">
        {results !== null ? (
          <ul className="flex flex-col gap-1">
            {results.length === 0 && <li className="px-3 py-2 text-sm text-muted">No chats match.</li>}
            {results.map((result) => (
              <li key={result.id}>
                <button
                  type="button"
                  onClick={() => {
                    open(result.id);
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
        ) : (
          <>
            {ready && conversations.length === 0 && <p className="px-3 py-2 text-sm text-muted">No chats yet. Start one above.</p>}
            {groups.map((group) => (
              <section key={group.label} className="flex flex-col gap-0.5">
                <h3 className="px-3 pb-1 text-xs font-medium text-muted">{group.label}</h3>
                <ul className="flex flex-col gap-0.5">
                  {group.items.map((conversation) => {
                    const active = pathname === "/" && conversation.id === selectedId;
                    return (
                      <li key={conversation.id} className={`group flex items-center rounded-xl ${active ? "bg-raised" : "hover:bg-raised"}`}>
                        <button
                          type="button"
                          onClick={() => open(conversation.id)}
                          aria-current={active ? "true" : undefined}
                          className={`min-w-0 flex-1 truncate px-3 py-2 text-left text-sm ${active ? "font-medium text-ink" : "text-muted group-hover:text-ink"}`}
                        >
                          {conversation.title}
                        </button>
                        <Menu
                          label={`Actions for ${conversation.title}`}
                          trigger={<Icon name="more_horiz" size={20} />}
                          items={chatMenuItems(conversation.id, conversation.title)}
                          width="w-52"
                          triggerClassName="mr-1 flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-panel hover:text-ink md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
                        />
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
