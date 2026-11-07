"use client";

import { useCallback, useEffect, useState } from "react";
import { approvalsChangedEvent } from "@/components/events";

export interface Account {
  name: string;
  email: string;
}

export interface NavData {
  pendingCount: number;
  unreadCount: number;
  account: Account | null;
}

const unreadPollMilliseconds = 30000;
const freshMilliseconds = 20000;

let cache: NavData = { pendingCount: 0, unreadCount: 0, account: null };
let loadedAt = 0;

export function useNavData(): NavData {
  const [data, setData] = useState<NavData>(cache);

  const update = useCallback((change: Partial<NavData>) => {
    cache = { ...cache, ...change };
    setData(cache);
  }, []);

  const loadPending = useCallback(() => {
    fetch("/api/approvals")
      .then((response) => response.json() as Promise<{ approvals: unknown[] }>)
      .then((result) => update({ pendingCount: result.approvals.length }))
      .catch(() => undefined);
  }, [update]);

  const loadUnread = useCallback(() => {
    if (document.hidden) {
      return;
    }
    fetch("/api/notifications")
      .then((response) => response.json() as Promise<{ unread: number }>)
      .then((result) => update({ unreadCount: result.unread }))
      .catch(() => undefined);
  }, [update]);

  useEffect(() => {
    if (Date.now() - loadedAt > freshMilliseconds) {
      loadedAt = Date.now();
      if (!cache.account) {
        fetch("/api/auth/me")
          .then((response) => response.json() as Promise<{ user: Account | null }>)
          .then((result) => update({ account: result.user }))
          .catch(() => undefined);
      }
      loadPending();
      loadUnread();
    }
    const timer = setInterval(loadUnread, unreadPollMilliseconds);
    window.addEventListener(approvalsChangedEvent, loadPending);
    return () => {
      clearInterval(timer);
      window.removeEventListener(approvalsChangedEvent, loadPending);
    };
  }, [loadPending, loadUnread, update]);

  return data;
}
