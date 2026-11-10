export interface AssistantName {
  name: string;
  strength: string;
}

export const defaultBotSlug = "doom_prime";
export const defaultBotName = "DOOM PRIME";

export const assistantNames: AssistantName[] = [
  { name: "Jarvis", strength: "systems management and technical help" },
  { name: "Edith", strength: "watching your inbox and alerts, like surveillance and intelligence" },
  { name: "Friday", strength: "tactical day planning, calendar and schedule support" },
  { name: "Vision", strength: "deep reasoning, analysis and decisions" },
  { name: "Ultron", strength: "self-improving automation and large-scale research" },
  { name: "Nimrod", strength: "adapting to changing tasks and tough multi-step jobs" },
  { name: "H.O.M.E.R.", strength: "simple everyday help and reminders" },
  { name: "Cerebro", strength: "finding and tracking people, news and topics" },
  { name: "Cerebra", strength: "advanced tracking of many topics at once" },
  { name: "Alkhema", strength: "focused, fast automation jobs" },
  { name: "Victor Mancha", strength: "human-style personal tasks and writing" },
  { name: "Virginia", strength: "caring check-ins, home and family reminders" },
  { name: "Baymax", strength: "health, wellness and personal care" },
  { name: "DUM-E", strength: "simple fetch-and-carry jobs, notes and files" },
  { name: "U", strength: "tidying lists, to-dos and loose ends" },
  { name: "DOOM-01", strength: "reliable first-generation basics, step-by-step routine jobs" },
  { name: "DOOMBOT PRIME", strength: "all-round primary robotic assistant for everyday tasks" },
  { name: "VICTOR", strength: "personal strategy, goals and planning, inspired by Victor von Doom" },
  { name: "LATVERIA", strength: "running a whole area: projects, records and organization, inspired by Doom's kingdom" },
];

export function assistantNameGuide(): string {
  return assistantNames.map((item) => `${item.name} (${item.strength})`).join("; ");
}
