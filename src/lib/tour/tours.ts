import type { FeatureId } from "@/lib/tour/features";

export interface TourStep {
  id: string;
  targets: string[];
  title: string;
  body: string;
  feature?: FeatureId;
  google?: boolean;
}

export type TourKey = "chat" | "bots" | "alerts" | "briefing" | "todos" | "approvals" | "connections" | "settings";

const pathKeys: Record<string, TourKey> = {
  "/": "chat",
  "/bots": "bots",
  "/alerts": "alerts",
  "/briefing": "briefing",
  "/todos": "todos",
  "/approvals": "approvals",
  "/connections": "connections",
  "/settings": "settings",
};

export function tourKeyFor(pathname: string): TourKey | null {
  return pathKeys[pathname] ?? null;
}

export const tours: Record<TourKey, TourStep[]> = {
  chat: [
    {
      id: "new-chat",
      targets: ["sidebar-new", "mobile-menu"],
      title: "Start fresh",
      body: "Begin a new chat any time. Your earlier chats stay in the list.",
    },
    {
      id: "search",
      targets: ["sidebar-search"],
      title: "Find any chat",
      body: "Type a word you remember and DOOMBOT finds the chat.",
    },
    {
      id: "composer",
      targets: ["composer"],
      title: "Give your command",
      body: "Type here and press Enter to send. Shift+Enter adds a new line.",
      feature: "chat",
    },
    {
      id: "attach",
      targets: ["composer-attach"],
      title: "Show, don't just tell",
      body: "Add a picture or a PDF and ask about it. Tap the mic to talk instead.",
    },
    {
      id: "approvals",
      targets: ["account-menu", "mobile-menu"],
      title: "Nothing moves without your OK",
      body: "Before DOOMBOT sends, deletes or changes anything, it asks you first in Approvals.",
      feature: "approvals",
    },
    {
      id: "menu",
      targets: ["account-menu", "mobile-menu"],
      title: "Your command center",
      body: "Doombots, Alerts, Briefing, To-do and Settings all live in this menu.",
      feature: "doombots",
    },
    {
      id: "google",
      targets: [],
      title: "Connect Google for the proactive features",
      body: "Link Gmail and Calendar so DOOMBOT can warn you about urgent email and plan your day.",
      feature: "google",
      google: true,
    },
  ],
  bots: [
    {
      id: "bots-new",
      targets: ["bots-new"],
      title: "Build your army",
      body: "Create a Doombot with one job. Let DOOMBOT design it for you, or build it yourself.",
      feature: "doombots",
    },
    {
      id: "bots-routine",
      targets: [],
      title: "Set it and forget it",
      body: "Pick a Doombot and give it a routine. It runs on its own every day, week or month.",
      feature: "routines",
    },
  ],
  alerts: [
    {
      id: "alerts",
      targets: [],
      title: "Your alerts",
      body: "Results and warnings from your Doombots land here. Turn on notifications to get them on your phone.",
      feature: "alerts",
    },
  ],
  briefing: [
    {
      id: "briefing",
      targets: [],
      title: "Your morning briefing",
      body: "Each morning DOOMBOT sums up your day: weather, to-dos, and your calendar and email once Google is connected.",
      feature: "briefing",
    },
  ],
  todos: [
    {
      id: "todos",
      targets: [],
      title: "Your to-do list",
      body: "Add tasks here, or just say it in chat. DOOMBOT keeps the list for you.",
      feature: "todos",
    },
  ],
  approvals: [
    {
      id: "approvals",
      targets: [],
      title: "You have the final word",
      body: "Every action that changes something waits here. Approve it or reject it.",
      feature: "approvals",
    },
  ],
  connections: [
    {
      id: "connections",
      targets: [],
      title: "Connect Google for the proactive features",
      body: "Link Gmail and Calendar so DOOMBOT can watch for what matters and tell you first.",
      feature: "google",
      google: true,
    },
  ],
  settings: [
    {
      id: "settings",
      targets: [],
      title: "Make it yours",
      body: "Set your city, your time zone and how DOOMBOT talks to you. Your memories live here too.",
      feature: "memory",
    },
  ],
};
