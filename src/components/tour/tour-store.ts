"use client";

import { useSyncExternalStore } from "react";
import type { TourKey } from "@/lib/tour/tours";

export type TourChoice = "unset" | "tour" | "none";

interface StoredTour {
  choice: TourChoice;
  seen: TourKey[];
}

export interface TourState extends StoredTour {
  dismissed: TourKey[];
}

const storageKey = "doombot.tour";
const serverState: TourState = { choice: "none", seen: [], dismissed: [] };
const freshState: TourState = { choice: "unset", seen: [], dismissed: [] };
const listeners = new Set<() => void>();
let current: TourState | null = null;

function load(): TourState {
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (stored === null) {
      return freshState;
    }
    const parsed = JSON.parse(stored) as Partial<TourState>;
    return {
      choice: parsed.choice === "tour" || parsed.choice === "none" ? parsed.choice : "unset",
      seen: Array.isArray(parsed.seen) ? parsed.seen : [],
      dismissed: [],
    };
  } catch {
    return freshState;
  }
}

function getSnapshot(): TourState {
  current ??= load();
  return current;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function update(change: Partial<TourState>): void {
  current = { ...getSnapshot(), ...change };
  const stored: StoredTour = { choice: current.choice, seen: current.seen };
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(stored));
  } catch {
    return;
  } finally {
    listeners.forEach((listener) => listener());
  }
}

export function useTourState(): TourState {
  return useSyncExternalStore(subscribe, getSnapshot, () => serverState);
}

export function chooseTour(wantsTour: boolean): void {
  update({ choice: wantsTour ? "tour" : "none" });
}

export function finishTour(key: TourKey, hideNextTime: boolean): void {
  const { seen, dismissed } = getSnapshot();
  update({
    dismissed: [...dismissed, key],
    seen: hideNextTime && !seen.includes(key) ? [...seen, key] : seen,
  });
}

export function skipAllTours(): void {
  update({ choice: "none" });
}

export function replayTours(): void {
  update({ choice: "unset", seen: [], dismissed: [] });
}
