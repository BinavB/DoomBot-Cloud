import { dayRules, type Frequency } from "@/lib/bots/frequency";
import type { BotLook } from "@/lib/bots/look";

export interface BotActivity {
  running: number;
  total: number;
  failed: number;
  lastStatus: string | null;
  lastAt: string | null;
}

export interface BotRoutineView {
  instruction: string;
  time: string;
  enabled: boolean;
  frequency: Frequency;
  day: number | null;
}

export interface Bot {
  look: BotLook;
  activity: BotActivity;
  id: number;
  slug: string;
  name: string;
  instructions: string;
  toolNames: string[];
  builtIn: boolean;
  routine: BotRoutineView | null;
}

export interface BotTask {
  id: number;
  instruction: string;
  status: string;
  result: string | null;
  source: string;
  createdAt: string;
}

export interface BotMemory {
  id: number;
  fact: string;
}

export interface ToolInfo {
  name: string;
  description: string;
}

export const jsonHeaders = { "Content-Type": "application/json" };

export const sourceLabels: Record<string, string> = {
  chat: "From chat",
  assigned: "Assigned",
  routine: "Routine",
};

export const statusStyles: Record<string, string> = {
  running: "text-signal",
  done: "text-doom",
  failed: "text-danger",
};

function parseStored(sqliteTime: string): Date {
  return new Date(`${sqliteTime.replace(" ", "T")}Z`);
}

export function formatTime(sqliteTime: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parseStored(sqliteTime));
}

export function formatClock(sqliteTime: string): string {
  return new Intl.DateTimeFormat("en-GB", { timeStyle: "short" }).format(
    parseStored(sqliteTime),
  );
}

export function withIdleActivity<T extends { activity?: BotActivity }>(
  bot: T,
): T & { activity: BotActivity } {
  return {
    ...bot,
    activity: bot.activity ?? {
      running: 0,
      total: 0,
      failed: 0,
      lastStatus: null,
      lastAt: null,
    },
  };
}

export function activityLabel(activity: BotActivity): {
  text: string;
  style: string;
} {
  if (activity.running > 0) {
    return { text: "Working now", style: "text-signal" };
  }
  if (!activity.lastStatus || !activity.lastAt) {
    return { text: "No tasks yet", style: "text-muted" };
  }
  const when = formatClock(activity.lastAt);
  return activity.lastStatus === "failed"
    ? { text: `Failed at ${when}`, style: "text-danger" }
    : { text: `Done at ${when}`, style: "text-doom" };
}

export function toggleName(list: string[], name: string): string[] {
  return list.includes(name)
    ? list.filter((item) => item !== name)
    : [...list, name];
}

export function nextRoutineDay(frequency: Frequency): number | null {
  return dayRules[frequency]?.fallback ?? null;
}

export function monthDates(): number[] {
  return Array.from(
    { length: dayRules.monthly?.max ?? 28 },
    (_, index) => index + 1,
  );
}
