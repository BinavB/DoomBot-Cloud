import { currentUserId } from "@/lib/auth/context";
import { config } from "@/lib/config";
import { defaultTopics, normalizeTopics, type TopicId } from "@/lib/briefing/topics";
import { isValidTimeZone } from "@/lib/time";
import { queryRow, queryRows, runStatement } from "@/lib/database";

export const maxInstructionsLength = 1500;
const maxMemories = 200;

export interface UserMemory {
  id: number;
  fact: string;
  createdAt: string;
}

export async function getCustomInstructions(): Promise<string> {
  const row = await queryRow<{ custom_instructions: string }>(
    "SELECT custom_instructions FROM user_settings WHERE user_id = ?",
    [currentUserId()],
  );
  return row?.custom_instructions ?? "";
}

export async function saveCustomInstructions(text: string): Promise<void> {
  await runStatement(
    `INSERT INTO user_settings (user_id, custom_instructions) VALUES (?, ?)
     ON CONFLICT(user_id) DO UPDATE SET custom_instructions = excluded.custom_instructions`,
    [currentUserId(), text.trim().slice(0, maxInstructionsLength)],
  );
}

export async function getBriefingTopics(): Promise<TopicId[]> {
  const row = await queryRow<{ topics: string }>("SELECT topics FROM user_briefing_topics WHERE user_id = ?", [currentUserId()]);
  if (!row) {
    return defaultTopics;
  }
  try {
    return normalizeTopics(JSON.parse(row.topics));
  } catch {
    return defaultTopics;
  }
}

export async function saveBriefingTopics(topics: TopicId[]): Promise<void> {
  await runStatement(
    `INSERT INTO user_briefing_topics (user_id, topics) VALUES (?, ?)
     ON CONFLICT(user_id) DO UPDATE SET topics = excluded.topics`,
    [currentUserId(), JSON.stringify(topics)],
  );
}

export async function saveDetectedTimeZone(timeZone: string): Promise<boolean> {
  const value = timeZone.trim();
  if (!isValidTimeZone(value)) {
    return false;
  }
  await runStatement("INSERT OR IGNORE INTO user_timezones (user_id, time_zone) VALUES (?, ?)", [currentUserId(), value]);
  return true;
}

export async function getTimeZone(): Promise<string> {
  const row = await queryRow<{ time_zone: string }>("SELECT time_zone FROM user_timezones WHERE user_id = ?", [
    currentUserId(),
  ]);
  return row?.time_zone ?? config.timezone;
}

export async function saveTimeZone(timeZone: string): Promise<boolean> {
  const value = timeZone.trim();
  if (!isValidTimeZone(value)) {
    return false;
  }
  await runStatement(
    `INSERT INTO user_timezones (user_id, time_zone) VALUES (?, ?)
     ON CONFLICT(user_id) DO UPDATE SET time_zone = excluded.time_zone`,
    [currentUserId(), value],
  );
  return true;
}

export async function listUserMemories(): Promise<UserMemory[]> {
  const rows = await queryRows<{ id: number; fact: string; created_at: string }>(
    "SELECT id, fact, created_at FROM user_memories WHERE user_id = ? ORDER BY id DESC LIMIT ?",
    [currentUserId(), maxMemories],
  );
  return rows.map((row) => ({ id: row.id, fact: row.fact, createdAt: row.created_at }));
}

export async function addUserMemory(fact: string): Promise<void> {
  await runStatement("INSERT INTO user_memories (user_id, fact) VALUES (?, ?)", [currentUserId(), fact.trim()]);
}

export async function deleteUserMemory(id: number): Promise<void> {
  await runStatement("DELETE FROM user_memories WHERE id = ? AND user_id = ?", [id, currentUserId()]);
}

export interface HomeLocation {
  city: string;
  latitude: number;
  longitude: number;
}

export async function getHomeLocation(): Promise<HomeLocation | null> {
  const row = await queryRow<{ city: string; latitude: number; longitude: number }>(
    "SELECT city, latitude, longitude FROM user_locations WHERE user_id = ?",
    [currentUserId()],
  );
  return row ?? null;
}

export async function saveHomeLocation(location: HomeLocation): Promise<void> {
  await runStatement(
    `INSERT INTO user_locations (user_id, city, latitude, longitude) VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET city = excluded.city, latitude = excluded.latitude, longitude = excluded.longitude`,
    [currentUserId(), location.city, location.latitude, location.longitude],
  );
}

export async function clearHomeLocation(): Promise<void> {
  await runStatement("DELETE FROM user_locations WHERE user_id = ?", [currentUserId()]);
}
