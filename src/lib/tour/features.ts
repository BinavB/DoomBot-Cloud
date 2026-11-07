export type FeatureId = "chat" | "doombots" | "routines" | "briefing" | "approvals" | "alerts" | "memory" | "google" | "todos";

export interface Feature {
  id: FeatureId;
  icon: string;
  name: string;
  short: string;
  details: string[];
}

export const features: Record<FeatureId, Feature> = {
  chat: {
    id: "chat",
    icon: "forum",
    name: "Chat",
    short: "Ask anything. Add a picture or a PDF.",
    details: [
      "Type a question or a task and DOOMBOT answers right away.",
      "Attach a picture or a PDF and ask about it.",
      "Tap the microphone to talk instead of typing.",
      "Every chat is saved. Find old ones with the search box in the sidebar.",
    ],
  },
  doombots: {
    id: "doombots",
    icon: "smart_toy",
    name: "Doombots",
    short: "Small helpers that each do one job.",
    details: [
      "A Doombot is a helper with one job, like watching your email or tracking your tasks.",
      "Describe what you need and DOOMBOT designs them for you, or build one yourself.",
      "Each Doombot keeps its own private memory.",
      "Doombots never send, delete or spend anything without your approval.",
    ],
  },
  routines: {
    id: "routines",
    icon: "schedule",
    name: "Routines",
    short: "Jobs that run on their own, on time.",
    details: [
      "Give a Doombot a routine, like checking your calendar every morning at 7:30.",
      "Choose every day, every week or every month.",
      "Results arrive in Alerts and in that Doombot's task list.",
      "Pause, run now or remove a routine at any time.",
    ],
  },
  briefing: {
    id: "briefing",
    icon: "wb_twilight",
    name: "Morning briefing",
    short: "A short summary of your day, every morning.",
    details: [
      "Every morning DOOMBOT writes a short summary of your day.",
      "It includes your weather, your to-dos and, once Google is connected, your calendar and important email.",
      "Open Briefing to read it, or make a new one any time.",
    ],
  },
  approvals: {
    id: "approvals",
    icon: "verified_user",
    name: "Approvals",
    short: "Nothing changes without your OK.",
    details: [
      "Before DOOMBOT sends an email, changes an event or deletes something, it asks you first.",
      "Waiting requests appear in Approvals with a red dot in your menu.",
      "Approve to let it happen, or reject to cancel it. Nothing happens until you choose.",
    ],
  },
  alerts: {
    id: "alerts",
    icon: "notifications",
    name: "Alerts",
    short: "Get told when something needs you.",
    details: [
      "Your Doombots post their results and warnings here.",
      "Turn on notifications to get alerts on your phone or computer, even when DOOMBOT is closed.",
      "Install DOOMBOT from your profile menu for the best phone experience.",
    ],
  },
  memory: {
    id: "memory",
    icon: "psychology",
    name: "Memory",
    short: "Remembers what matters to you.",
    details: [
      "Tell DOOMBOT things about you, like your city or how you like answers, and it remembers.",
      "It asks before saving a new memory.",
      "See and delete your memories in Settings at any time.",
    ],
  },
  todos: {
    id: "todos",
    icon: "task_alt",
    name: "To-do",
    short: "Your list, kept by DOOMBOT.",
    details: [
      "Add tasks here, or just say it in chat, like \"add buy milk to my list\".",
      "Tick them off when they are done.",
      "Your open tasks show up in your morning briefing.",
    ],
  },
  google: {
    id: "google",
    icon: "hub",
    name: "Google connection",
    short: "Connect Gmail and Calendar for proactive help.",
    details: [
      "Connect your Google account so DOOMBOT can read your Gmail and Calendar.",
      "It can then warn you about urgent email and upcoming events, and add them to your morning briefing.",
      "It only reads on its own. Sending email or changing events always waits for your approval.",
      "Disconnect at any time from Connections.",
    ],
  },
};

export const welcomeFeatures: FeatureId[] = ["chat", "doombots", "briefing", "approvals", "alerts", "memory"];
