"use client";

export type StatusTone = "working" | "done" | "error";

export interface StatusState {
  id: number;
  tone: StatusTone;
  label: string;
}

const doneVisibleMilliseconds = 3000;
const errorVisibleMilliseconds = 6000;

let current: StatusState | null = null;
let nextId = 1;
let hideTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

function publish(state: StatusState | null): void {
  current = state;
  listeners.forEach((listener) => listener());
}

function scheduleHide(id: number, delay: number): void {
  if (hideTimer) {
    clearTimeout(hideTimer);
  }
  hideTimer = setTimeout(() => {
    if (current?.id === id) {
      publish(null);
    }
  }, delay);
}

export function subscribeStatus(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function readStatus(): StatusState | null {
  return current;
}

export function dismissStatus(): void {
  publish(null);
}

export interface StatusHandle {
  done: (label: string) => void;
  fail: (label: string) => void;
}

export function startStatus(label: string): StatusHandle {
  const id = nextId++;
  if (hideTimer) {
    clearTimeout(hideTimer);
  }
  publish({ id, tone: "working", label });
  return {
    done: (doneLabel) => {
      if (current?.id === id) {
        publish({ id, tone: "done", label: doneLabel });
        scheduleHide(id, doneVisibleMilliseconds);
      }
    },
    fail: (failLabel) => {
      if (current?.id === id) {
        publish({ id, tone: "error", label: failLabel });
        scheduleHide(id, errorVisibleMilliseconds);
      }
    },
  };
}

export function announceStatus(label: string, tone: Exclude<StatusTone, "working"> = "done", visibleMilliseconds?: number): void {
  const id = nextId++;
  publish({ id, tone, label });
  scheduleHide(id, visibleMilliseconds ?? (tone === "error" ? errorVisibleMilliseconds : doneVisibleMilliseconds));
}
