import { createNotification } from "@/lib/notifications";
import { queryRow, runStatement } from "@/lib/database";
import { currentUserId } from "@/lib/auth/context";
import { unreadEmailsSince, type NewEmail } from "@/lib/google/client";
import { isGoogleConnected } from "@/lib/google/oauth";

export const maxMailAlertsPerCheck = 5;

export function newEmailsAfter(emails: NewEmail[], afterMs: number): NewEmail[] {
  return emails
    .filter((email) => email.receivedAt > afterMs)
    .sort((first, second) => first.receivedAt - second.receivedAt)
    .slice(0, maxMailAlertsPerCheck);
}

export async function getMailWatch(): Promise<{ enabled: boolean }> {
  const row = await queryRow<{ enabled: number }>("SELECT enabled FROM mail_watch WHERE user_id = ?", [currentUserId()]);
  return { enabled: row?.enabled === 1 };
}

export async function setMailWatch(enabled: boolean): Promise<void> {
  await runStatement(
    `INSERT INTO mail_watch (user_id, enabled, last_received) VALUES (?, ?, ?)
     ON CONFLICT (user_id) DO UPDATE SET enabled = excluded.enabled, last_received = excluded.last_received`,
    [currentUserId(), enabled ? 1 : 0, Date.now()],
  );
}

export async function alertNewEmails(): Promise<void> {
  const row = await queryRow<{ enabled: number; last_received: number }>(
    "SELECT enabled, last_received FROM mail_watch WHERE user_id = ?",
    [currentUserId()],
  );
  if (!row || row.enabled !== 1 || !(await isGoogleConnected())) {
    return;
  }
  const emails = newEmailsAfter(await unreadEmailsSince(row.last_received, 20), row.last_received);
  for (const email of emails) {
    await createNotification({
      botId: null,
      title: `New email from ${email.from}`,
      body: email.subject,
      urgent: false,
    });
  }
  const newest = emails.length > 0 ? emails[emails.length - 1].receivedAt : row.last_received;
  await runStatement("UPDATE mail_watch SET last_received = ? WHERE user_id = ?", [newest, currentUserId()]);
}
