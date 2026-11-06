import { config } from "@/lib/config";
import { queryRow, queryRows, runStatement } from "@/lib/database";

export interface User {
  id: number;
  email: string;
  name: string;
  picture: string | null;
}

export interface GoogleProfile {
  sub: string;
  email: string;
  name: string;
  picture: string | null;
}

const activeWindowDays = 14;
const seenRefreshMinutes = 60;

export interface SignedInUser {
  user: User;
  sessionVersion: number;
}

export async function upsertGoogleUser(profile: GoogleProfile): Promise<SignedInUser> {
  const row = await queryRow<User & { session_version: number }>(
    `INSERT INTO users (google_sub, email, name, picture) VALUES (?, ?, ?, ?)
     ON CONFLICT(google_sub) DO UPDATE SET email = excluded.email, name = excluded.name,
       picture = excluded.picture, last_seen_at = datetime('now')
     RETURNING id, email, name, picture, session_version`,
    [profile.sub, profile.email, profile.name, profile.picture],
  );
  const signedIn = row as User & { session_version: number };
  return {
    user: { id: signedIn.id, email: signedIn.email, name: signedIn.name, picture: signedIn.picture },
    sessionVersion: signedIn.session_version,
  };
}

export async function revokeSessions(userId: number): Promise<void> {
  await runStatement("UPDATE users SET session_version = session_version + 1 WHERE id = ?", [userId]);
}

export async function findSessionUser(userId: number, version: number): Promise<User | null> {
  const row = await queryRow<User>("SELECT id FROM users WHERE id = ? AND session_version = ?", [userId, version]);
  return row ? findUser(userId) : null;
}

export async function findUser(userId: number): Promise<User | null> {
  const row = await queryRow<User>("SELECT id, email, name, picture FROM users WHERE id = ?", [userId]);
  if (!row) {
    return null;
  }
  await runStatement("UPDATE users SET last_seen_at = datetime('now') WHERE id = ? AND last_seen_at < datetime('now', ?)", [
    userId,
    `-${seenRefreshMinutes} minutes`,
  ]);
  return row;
}

export async function getUserTimeZone(userId: number): Promise<string> {
  const row = await queryRow<{ time_zone: string }>("SELECT time_zone FROM user_timezones WHERE user_id = ?", [userId]);
  return row?.time_zone ?? config.timezone;
}

export async function listActiveUsers(): Promise<{ id: number; timeZone: string }[]> {
  const rows = await queryRows<{ id: number; time_zone: string | null }>(
    `SELECT u.id AS id, t.time_zone AS time_zone FROM users u
     LEFT JOIN user_timezones t ON t.user_id = u.id
     WHERE u.last_seen_at >= datetime('now', ?)`,
    [`-${activeWindowDays} days`],
  );
  return rows.map((row) => ({ id: row.id, timeZone: row.time_zone ?? config.timezone }));
}
