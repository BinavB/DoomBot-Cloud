import { todaysCalendarEvents, unreadEmailSummaries } from "@/lib/google/client";
import { formatEmailsForTriage, triageEmailLimit } from "@/lib/google/triage";
import { listTodos } from "@/lib/todos";
import { describeNow } from "@/lib/time";

async function optionalContext(read: () => Promise<string>, label: string): Promise<string> {
  try {
    return await read();
  } catch {
    return `${label}: not available.`;
  }
}

export async function gatherPersonalContext(): Promise<string> {
  const todos = (await listTodos()).filter((todo) => !todo.done).slice(0, 20);
  const todoLines = todos.length > 0 ? todos.map((todo) => `- ${todo.title}`).join("\n") : "(none)";
  const calendar = await optionalContext(async () => {
    const events = await todaysCalendarEvents();
    return `Today's calendar:\n${events.length > 0 ? events.join("\n") : "(no events)"}`;
  }, "Today's calendar");
  const mail = await optionalContext(
    async () => `Unread mail:\n${formatEmailsForTriage(await unreadEmailSummaries(triageEmailLimit))}`,
    "Unread mail",
  );
  return [`The current time is ${describeNow()}.`, `Open to-dos:\n${todoLines}`, calendar, mail].join("\n\n");
}
