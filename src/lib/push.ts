import webpush from "web-push";
import { currentUserId } from "@/lib/auth/context";
import { queryRows, runStatement } from "@/lib/database";

export interface PushSubscriptionInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export interface PushPayload {
  title: string;
  body: string;
  url: string;
  urgent: boolean;
}

interface VapidKeys {
  publicKey: string;
  privateKey: string;
}

interface SubscriptionRow {
  endpoint: string;
  p256dh: string;
  auth: string;
}

const vapidSubject = "mailto:doombot-alerts@example.com";
const pushTimeToLive = 86400;

async function readVapidKeys(): Promise<VapidKeys | null> {
  const rows = await queryRows<{ key: string; value: string }>(
    "SELECT key, value FROM app_settings WHERE key IN ('vapid_public_key', 'vapid_private_key')",
  );
  const publicKey = rows.find((row) => row.key === "vapid_public_key")?.value;
  const privateKey = rows.find((row) => row.key === "vapid_private_key")?.value;
  return publicKey && privateKey ? { publicKey, privateKey } : null;
}

async function loadVapidKeys(): Promise<VapidKeys> {
  const existing = await readVapidKeys();
  if (existing) {
    return existing;
  }
  const generated = webpush.generateVAPIDKeys();
  await runStatement(
    "INSERT OR IGNORE INTO app_settings (key, value) VALUES ('vapid_public_key', ?), ('vapid_private_key', ?)",
    [generated.publicKey, generated.privateKey],
  );
  return (await readVapidKeys()) ?? generated;
}

export async function vapidPublicKey(): Promise<string> {
  return (await loadVapidKeys()).publicKey;
}

export async function saveSubscription(subscription: PushSubscriptionInput): Promise<void> {
  await runStatement(
    `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth) VALUES (?, ?, ?, ?)
     ON CONFLICT(endpoint) DO UPDATE SET user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth`,
    [currentUserId(), subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth],
  );
}

export async function removeSubscription(endpoint: string): Promise<void> {
  await runStatement("DELETE FROM push_subscriptions WHERE endpoint = ? AND user_id = ?", [
    endpoint,
    currentUserId(),
  ]);
}

export async function sendPushToCurrentUser(payload: PushPayload): Promise<void> {
  const rows = await queryRows<SubscriptionRow>(
    "SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?",
    [currentUserId()],
  );
  if (rows.length === 0) {
    return;
  }
  const keys = await loadVapidKeys();
  webpush.setVapidDetails(vapidSubject, keys.publicKey, keys.privateKey);
  const body = JSON.stringify(payload);
  await Promise.all(
    rows.map(async (row) => {
      try {
        await webpush.sendNotification(
          { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
          body,
          { TTL: pushTimeToLive },
        );
      } catch (error) {
        if (error instanceof webpush.WebPushError && (error.statusCode === 404 || error.statusCode === 410)) {
          await removeSubscription(row.endpoint);
          return;
        }
        console.error("Push alert failed:", error);
      }
    }),
  );
}
