"use client";

import { useSyncExternalStore } from "react";
import { clampSidebarWidth, defaultSidebarWidth } from "@/lib/sidebar-width";

const storageKey = "doombot.sidebarWidth";
const listeners = new Set<() => void>();

function readStored(): number {
  try {
    const stored = window.localStorage.getItem(storageKey);
    return stored === null ? defaultSidebarWidth : clampSidebarWidth(Number(stored), window.innerWidth);
  } catch {
    return defaultSidebarWidth;
  }
}

let current: number | null = null;

function getSnapshot(): number {
  current ??= readStored();
  return current;
}

function getServerSnapshot(): number {
  return defaultSidebarWidth;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setSidebarWidth(width: number, persist: boolean): void {
  current = clampSidebarWidth(width, window.innerWidth);
  listeners.forEach((listener) => listener());
  if (persist) {
    try {
      window.localStorage.setItem(storageKey, String(current));
    } catch {
      return;
    }
  }
}

export function useSidebarWidth(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
