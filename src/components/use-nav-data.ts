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

const unreadPollMilliseconds = 15000;

export function useNavData(): NavData {
  const [pendingCount, setPendingCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [account, setAccount] = useState<Account | null>(null);

  const loadPending = useCallback(() => {
    fetch("/api/approvals")
      .then((response) => response.json() as Promise<{ approvals: unknown[] }>)
      .then((data) => setPendingCount(data.approvals.length))
      .catch(() => setPendingCount(0));
  }, []);

  const loadUnread = useCallback(() => {
    fetch("/api/notifications")
      .then((response) => response.json() as Promise<{ unread: number }>)
      .then((data) => setUnreadCount(data.unread))
      .catch(() => setUnreadCount(0));
  }, []);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((response) => response.json() as Promise<{ user: Account | null }>)
      .then((data) => setAccount(data.user))
      .catch(() => setAccount(null));
    loadPending();
    loadUnread();
    const timer = setInterval(loadUnread, unreadPollMilliseconds);
    window.addEventListener(approvalsChangedEvent, loadPending);
    return () => {
      clearInterval(timer);
      window.removeEventListener(approvalsChangedEvent, loadPending);
    };
  }, [loadPending, loadUnread]);

  return { pendingCount, unreadCount, account };
}
