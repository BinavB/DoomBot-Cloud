"use client";

import { useSyncExternalStore } from "react";
import type { Conversation } from "@/lib/conversations";

export type ChatMode = "fast" | "think";

export interface ShareNotice {
  id: string;
  url: string;
}

export interface ChatState {
  conversations: Conversation[];
  selectedId: string | null;
  ready: boolean;
  busy: boolean;
  mode: ChatMode;
  shareNotice: ShareNotice | null;
  error: string | null;
}

let state: ChatState = { conversations: [], selectedId: null, ready: false, busy: false, mode: "fast", shareNotice: null, error: null };
let started = false;
const listeners = new Set<() => void>();

function set(change: Partial<ChatState>): void {
  state = { ...state, ...change };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useChatState(): ChatState {
  return useSyncExternalStore(subscribe, () => state, () => state);
}

export function getChatState(): ChatState {
  return state;
}

const jsonHeaders = { "Content-Type": "application/json" };
const lastChatKey = "doombot.lastChat";

function readLastChat(): string | null {
  try {
    return window.localStorage.getItem(lastChatKey);
  } catch {
    return null;
  }
}

function rememberChat(id: string | null): void {
  try {
    if (id === null) {
      window.localStorage.removeItem(lastChatKey);
    } else {
      window.localStorage.setItem(lastChatKey, id);
    }
  } catch {
    return;
  }
}

function restoredChatId(conversations: Conversation[]): string | null {
  const remembered = readLastChat();
  if (remembered && conversations.some((item) => item.id === remembered)) {
    return remembered;
  }
  return conversations[0]?.id ?? null;
}

export async function refreshChats(): Promise<void> {
  const response = await fetch("/api/conversations");
  const data = (await response.json()) as { conversations: Conversation[] };
  set({ conversations: data.conversations });
}

export function startChats(): void {
  if (started) {
    return;
  }
  started = true;
  refreshChats()
    .then(() => set({ ready: true, selectedId: state.selectedId ?? restoredChatId(state.conversations) }))
    .catch(() => {
      started = false;
      set({ ready: true, error: "Chats could not load. Reload the page to try again." });
    });
}

export function selectChat(id: string): void {
  if (state.busy) {
    return;
  }
  rememberChat(id);
  set({ selectedId: id, error: null });
}

export function setChatBusy(busy: boolean): void {
  set({ busy });
}

export function setMode(mode: ChatMode): void {
  set({ mode });
}

export function setChatError(error: string | null): void {
  set({ error });
}

export async function createChat(): Promise<string | null> {
  const response = await fetch("/api/conversations", { method: "POST" });
  const data = (await response.json()) as { conversation?: Conversation; error?: string };
  if (!response.ok || !data.conversation) {
    set({ error: data.error ?? "A new chat could not be started." });
    return null;
  }
  rememberChat(data.conversation.id);
  set({
    conversations: [data.conversation, ...state.conversations.filter((item) => item.id !== data.conversation?.id)],
    selectedId: data.conversation.id,
    error: null,
  });
  return data.conversation.id;
}

export async function renameChat(id: string, title: string): Promise<void> {
  const response = await fetch(`/api/conversations/${id}`, { method: "PATCH", headers: jsonHeaders, body: JSON.stringify({ title }) });
  if (!response.ok) {
    set({ error: "The chat could not be renamed." });
    return;
  }
  set({ conversations: state.conversations.map((item) => (item.id === id ? { ...item, title } : item)) });
}

export async function deleteChat(id: string): Promise<void> {
  const response = await fetch(`/api/conversations/${id}`, { method: "DELETE" });
  if (!response.ok) {
    set({ error: "The chat could not be deleted." });
    return;
  }
  const remaining = state.conversations.filter((item) => item.id !== id);
  const selectedId = state.selectedId === id ? (remaining[0]?.id ?? null) : state.selectedId;
  rememberChat(selectedId);
  set({ conversations: remaining, selectedId });
}

export async function shareChat(id: string): Promise<void> {
  const response = await fetch(`/api/conversations/${id}/share`, { method: "POST" });
  const data = (await response.json()) as { token?: string; error?: string };
  if (!response.ok || !data.token) {
    set({ error: data.error ?? "The chat could not be shared." });
    return;
  }
  const url = `${window.location.origin}/share/${data.token}`;
  set({ shareNotice: { id, url } });
  await navigator.clipboard.writeText(url).catch(() => undefined);
}

export async function stopSharing(id: string): Promise<void> {
  const response = await fetch(`/api/conversations/${id}/share`, { method: "DELETE" });
  set(response.ok ? { shareNotice: null } : { error: "Sharing could not be stopped." });
}

export function dismissShareNotice(): void {
  set({ shareNotice: null });
}
