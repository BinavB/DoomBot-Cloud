"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatLine } from "@/app/_components/chat/chat-types";
import { setChatError } from "@/components/chat-store";

interface History {
  id: string | null;
  lines: ChatLine[];
}

export interface ChatHistoryApi {
  lines: ChatLine[];
  loaded: boolean;
  update: (id: string, change: (current: ChatLine[]) => ChatLine[]) => void;
  reload: (id: string) => Promise<void>;
}

async function fetchMessages(id: string): Promise<ChatLine[] | null> {
  const response = await fetch(`/api/chat?conversation=${encodeURIComponent(id)}`);
  const data = (await response.json()) as { messages?: ChatLine[] };
  return data.messages ?? null;
}

export function useChatHistory(selectedId: string | null, ready: boolean, paused: boolean): ChatHistoryApi {
  const [history, setHistory] = useState<History>({ id: null, lines: [] });
  const pausedRef = useRef(paused);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    if (!selectedId) {
      return;
    }
    let active = true;
    fetchMessages(selectedId)
      .then((messages) => {
        if (active && messages && !pausedRef.current) {
          setHistory({ id: selectedId, lines: messages });
        }
      })
      .catch(() => setChatError("Chat history could not load. Reload the page to try again."));
    return () => {
      active = false;
    };
  }, [selectedId]);

  const update = useCallback((id: string, change: (current: ChatLine[]) => ChatLine[]) => {
    setHistory((current) => ({ id, lines: change(current.id === id ? current.lines : []) }));
  }, []);

  const reload = useCallback(async (id: string) => {
    const messages = await fetchMessages(id);
    if (messages) {
      setHistory({ id, lines: messages });
    }
  }, []);

  const matches = history.id === selectedId;
  return {
    lines: matches ? history.lines : [],
    loaded: ready && (selectedId === null || matches),
    update,
    reload,
  };
}
