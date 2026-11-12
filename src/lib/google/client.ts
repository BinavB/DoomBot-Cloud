import { AgentError } from "@/lib/errors";
import { getAccessToken } from "@/lib/google/oauth";
import { currentTimeZone } from "@/lib/auth/context";
import { buildRawEmail, type OutgoingMail } from "@/lib/google/mail";
import { currentDay, offsetFor } from "@/lib/time";

const dayMilliseconds = 24 * 60 * 60 * 1000;

interface CalendarEvent {
  summary?: string;
  start?: { dateTime?: string; date?: string };
}

interface MessageHeaders {
  snippet?: string;
  payload?: { headers?: { name: string; value: string }[] };
}

export interface EmailSummary {
  from: string;
  subject: string;
  snippet: string;
}

async function googleGet<T>(url: string): Promise<T> {
  const token = await getAccessToken();
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    throw new AgentError(`Google request failed (${response.status}).`);
  }
  return (await response.json()) as T;
}

function formatClock(isoTime: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: currentTimeZone(),
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(isoTime));
}

function todayBounds(): { start: string; end: string } {
  const timeZone = currentTimeZone();
  const day = currentDay(timeZone);
  const start = new Date(`${day}T00:00:00${offsetFor(timeZone, new Date(`${day}T12:00:00Z`))}`);
  return {
    start: start.toISOString(),
    end: new Date(start.getTime() + dayMilliseconds).toISOString(),
  };
}

export async function todaysCalendarEvents(): Promise<string[]> {
  const bounds = todayBounds();
  const url = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
  url.searchParams.set("timeMin", bounds.start);
  url.searchParams.set("timeMax", bounds.end);
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");
  url.searchParams.set("maxResults", "20");

  const data = await googleGet<{ items?: CalendarEvent[] }>(url.toString());
  return (data.items ?? []).map((event) => {
    const when = event.start?.dateTime ? formatClock(event.start.dateTime) : "all day";
    return `${when} - ${event.summary ?? "(no title)"}`;
  });
}

export async function unreadEmailSummaries(limit: number): Promise<EmailSummary[]> {
  const list = await googleGet<{ messages?: { id: string }[] }>(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is%3Aunread&maxResults=${limit}`,
  );
  const messages = await Promise.all(
    (list.messages ?? []).map((message) =>
      googleGet<MessageHeaders>(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(message.id)}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`,
      ),
    ),
  );
  return messages.map((message) => {
    const headers = message.payload?.headers ?? [];
    const read = (name: string) =>
      headers.find((header) => header.name.toLowerCase() === name.toLowerCase())?.value ?? "";
    return {
      from: read("From") || "unknown",
      subject: read("Subject") || "(no subject)",
      snippet: message.snippet ?? "",
    };
  });
}

export async function unreadEmails(): Promise<string[]> {
  const emails = await unreadEmailSummaries(5);
  return emails.map((email) => `From ${email.from}: ${email.subject}`);
}

export async function sendEmail(mail: OutgoingMail): Promise<void> {
  const token = await getAccessToken();
  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ raw: buildRawEmail(mail) }),
    signal: AbortSignal.timeout(15000),
  });
  if (response.status === 403) {
    throw new AgentError("Google refused to send the email. Connect Google again on the Connections page to allow sending mail.");
  }
  if (!response.ok) {
    throw new AgentError(`Google could not send the email (${response.status}).`);
  }
}

export async function openGoogleTasks(): Promise<string[]> {
  const lists = await googleGet<{ items?: { id: string; title?: string }[] }>(
    "https://tasks.googleapis.com/tasks/v1/users/@me/lists?maxResults=10",
  );
  const groups = await Promise.all(
    (lists.items ?? []).map(async (list) => {
      const tasks = await googleGet<{ items?: { title?: string }[] }>(
        `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(list.id)}/tasks?showCompleted=false&maxResults=20`,
      );
      return (tasks.items ?? []).map((task) => `${task.title ?? "(untitled)"} (${list.title ?? "list"})`);
    }),
  );
  return groups.flat();
}
