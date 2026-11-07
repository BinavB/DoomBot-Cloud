import { randomUUID } from "node:crypto";
import { deleteUserData } from "@/lib/account-data";
import { guestSignupsPerHour, staleGuestDays } from "@/lib/auth/guest-limits";
import { guestSubPrefix, upsertGoogleUser, type GoogleProfile, type SignedInUser } from "@/lib/auth/users";
import { queryRow, queryRows, runStatement } from "@/lib/database";

const movableTables = ["messages", "user_memories", "todos", "notes", "notifications"];
const movableIgnoringDuplicates = ["conversations", "message_feedback"];

export async function canCreateGuest(): Promise<boolean> {
  const row = await queryRow<{ total: number }>(
    "SELECT COUNT(*) AS total FROM users WHERE google_sub LIKE ? AND created_at >= datetime('now', '-1 hour')",
    [`${guestSubPrefix}%`],
  );
  return (row?.total ?? 0) < guestSignupsPerHour;
}

export async function createGuestUser(): Promise<SignedInUser> {
  const row = await queryRow<{ id: number; session_version: number }>(
    "INSERT INTO users (google_sub, email, name, picture) VALUES (?, '', 'Guest', NULL) RETURNING id, session_version",
    [`${guestSubPrefix}${randomUUID()}`],
  );
  if (!row) {
    throw new Error("The guest account could not be created.");
  }
  return {
    user: { id: row.id, email: "", name: "Guest", picture: null, guest: true },
    sessionVersion: row.session_version,
  };
}

async function existingGoogleUserId(sub: string): Promise<number | null> {
  const row = await queryRow<{ id: number }>("SELECT id FROM users WHERE google_sub = ?", [sub]);
  return row?.id ?? null;
}

export async function claimGuestAccount(guestId: number, profile: GoogleProfile): Promise<SignedInUser> {
  const existingId = await existingGoogleUserId(profile.sub);
  if (existingId === null) {
    await runStatement(`UPDATE users SET google_sub = ?, email = ?, name = ?, picture = ?, last_seen_at = datetime('now'),
       session_version = session_version + 1 WHERE id = ?`, [
      profile.sub,
      profile.email,
      profile.name,
      profile.picture,
      guestId,
    ]);
    return upsertGoogleUser(profile);
  }
  for (const table of movableIgnoringDuplicates) {
    await runStatement(`UPDATE OR IGNORE ${table} SET user_id = ? WHERE user_id = ?`, [existingId, guestId]);
  }
  for (const table of movableTables) {
    await runStatement(`UPDATE ${table} SET user_id = ? WHERE user_id = ?`, [existingId, guestId]);
  }
  await deleteUserData(guestId);
  return upsertGoogleUser(profile);
}

export async function removeStaleGuests(): Promise<void> {
  const stale = await queryRows<{ id: number }>(
    "SELECT id FROM users WHERE google_sub LIKE ? AND last_seen_at < datetime('now', ?) LIMIT 50",
    [`${guestSubPrefix}%`, `-${staleGuestDays} days`],
  );
  for (const guest of stale) {
    await deleteUserData(guest.id);
  }
}
