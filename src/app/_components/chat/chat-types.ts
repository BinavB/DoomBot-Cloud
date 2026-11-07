export interface ChatLine {
  id: number;
  role: "user" | "assistant";
  content: string;
  rating: number;
}

export const suggestions = [
  "Brief me on today",
  "What's on my calendar today?",
  "Summarize my unread email",
  "What's the weather in Dubai?",
];

export function visibleLines(lines: ChatLine[], sending: boolean): ChatLine[] {
  return lines.filter((line) => line.role === "user" || line.content.length > 0 || !sending);
}

export function lastUserBefore(lines: ChatLine[], index: number): ChatLine | undefined {
  return lines.slice(0, index).reverse().find((line) => line.role === "user");
}
