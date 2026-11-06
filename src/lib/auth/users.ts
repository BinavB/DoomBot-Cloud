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

export async function upsertGoogleUser(profile: GoogleProfile): Promise<User> {
  const row = await queryRow<User>(
    `INSERT INTO users (google_sub, email, name, picture) VALUES (?, ?, ?, ?)
     ON CONFLICT(google_sub) DO UPDATE SET email = excluded.email, name = excluded.name,
       picture = excluded.picture, last_seen_at = datetime('now')
     RETURNING id, email, name, picture`,
    [profile.sub, profile.email, profile.name, profile.picture],
  );
  return row as User;
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

export async function listActiveUserIds(): Promise<number[]> {
  const rows = await queryRows<{ id: number }>(
    "SELECT id FROM users WHERE last_seen_at >= datetime('now', ?) ORDER BY id",
    [`-${activeWindowDays} days`],
  );
  return rows.map((row) => row.id);
}
