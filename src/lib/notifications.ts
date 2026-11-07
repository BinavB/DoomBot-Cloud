import { currentUserId } from "@/lib/auth/context";
import { queryRow, queryRows, runStatement } from "@/lib/database";
import { sendPushToCurrentUser } from "@/lib/push";

export interface Notification {
  id: number;
  botId: number | null;
  title: string;
  body: string;
  urgent: boolean;
  read: boolean;
  createdAt: string;
}

interface NotificationRow {
  id: number;
  bot_id: number | null;
  title: string;
  body: string;
  urgent: number;
  read: number;
  created_at: string;
}

const listLimit = 50;
const pushBodyLength = 160;

function toNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    botId: row.bot_id,
    title: row.title,
    body: row.body,
    urgent: row.urgent === 1,
    read: row.read === 1,
    createdAt: row.created_at,
  };
}

export async function createNotification(input: {
  botId: number | null;
  title: string;
  body: string;
  urgent: boolean;
}): Promise<void> {
  await runStatement("INSERT INTO notifications (user_id, bot_id, title, body, urgent) VALUES (?, ?, ?, ?, ?)", [
    currentUserId(),
    input.botId,
    input.title,
    input.body,
    input.urgent ? 1 : 0,
  ]);
  sendPushToCurrentUser({
    title: input.title,
    body: input.body.slice(0, pushBodyLength),
    url: "/alerts",
    urgent: input.urgent,
  }).catch((error: unknown) => {
    console.error("Push alert failed:", error);
  });
}

export async function listNotifications(): Promise<Notification[]> {
  const rows = await queryRows<NotificationRow>(
    "SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT ?",
    [currentUserId(), listLimit],
  );
  return rows.map(toNotification);
}

export async function unreadCount(): Promise<number> {
  const row = await queryRow<{ count: number }>(
    "SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND read = 0",
    [currentUserId()],
  );
  return row?.count ?? 0;
}

export async function deleteNotification(id: number): Promise<boolean> {
  const row = await queryRow<{ id: number }>("DELETE FROM notifications WHERE id = ? AND user_id = ? RETURNING id", [
    id,
    currentUserId(),
  ]);
  return row !== undefined;
}

export async function clearNotifications(): Promise<void> {
  await runStatement("DELETE FROM notifications WHERE user_id = ?", [currentUserId()]);
}

export async function markAllRead(): Promise<void> {
  await runStatement("UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0", [currentUserId()]);
}
