import { currentUserId } from "@/lib/auth/context";
import { avatarOptions, builtInLooks, colorOptions, defaultLook, type BotLook } from "@/lib/bots/look";
import { defaultBotName, defaultBotSlug } from "@/lib/bots/names";
import type { Frequency } from "@/lib/bots/frequency";
import type { BotInput, BotRoutineInput } from "@/lib/bots/validate";
import { queryRow, queryRows, runStatement } from "@/lib/database";
import { AgentError } from "@/lib/errors";

export type TaskSource = "chat" | "assigned" | "routine";

export interface BotRoutine {
  instruction: string;
  time: string;
  enabled: boolean;
  frequency: Frequency;
  day: number | null;
  lastRun: string | null;
}

export interface Bot {
  id: number;
  userId: number;
  slug: string;
  name: string;
  instructions: string;
  toolNames: string[];
  builtIn: boolean;
  routine: BotRoutine | null;
  look: BotLook;
}

export interface BotTask {
  id: number;
  botId: number;
  instruction: string;
  status: string;
  result: string | null;
  source: string;
  createdAt: string;
  finishedAt: string | null;
}

export interface BotMemory {
  id: number;
  botId: number;
  fact: string;
  createdAt: string;
}

export interface BotMessage {
  role: "user" | "assistant";
  content: string;
}

interface BotRow {
  id: number;
  user_id: number;
  slug: string;
  name: string;
  instructions: string;
  tool_names: string;
  built_in: number;
  routine: string | null;
  routine_time: string | null;
  routine_enabled: number;
  routine_frequency: string;
  routine_day: number | null;
  routine_last_day: string | null;
  avatar: string | null;
  color: string | null;
}

interface TaskRow {
  id: number;
  bot_id: number;
  instruction: string;
  status: string;
  result: string | null;
  source: string;
  created_at: string;
  finished_at: string | null;
}

interface MemoryRow {
  id: number;
  bot_id: number;
  fact: string;
  created_at: string;
}

const maxBots = 20;

const builtInBots = [
  {
    slug: defaultBotSlug,
    name: defaultBotName,
    instructions:
      "You are DOOM PRIME, the main controlling AI, the default Doombot and chief of all the others. Handle any task the user gives you with your tools. Be brief and practical, and say so when nothing is found.",
    toolNames: [
      "get_current_time",
      "get_weather",
      "list_todos",
      "add_todo",
      "update_todo",
      "list_calendar_today",
      "list_unread_emails",
      "list_google_tasks",
      "list_notes",
    ],
  },
];

const substituteUpgrades = [
  {
    slug: "calendar",
    oldName: "Doombot Chronos",
    name: "Friday",
    instructions:
      "You are Friday, a substitute Doombot for tactical day planning. Use list_calendar_today to answer. Give times and titles only. If nothing is found, say so.",
  },
  {
    slug: "email",
    oldName: "Doombot Herald",
    name: "Edith",
    instructions:
      "You are Edith, a substitute Doombot that watches the inbox. Use list_unread_emails to answer. Summarize senders and subjects. You cannot send, reply or delete.",
  },
];

function toBot(row: BotRow): Bot {
  const fallback = builtInLooks[row.slug] ?? defaultLook(row.id);
  const validAvatar = avatarOptions.some((option) => option.id === row.avatar);
  const validColor = colorOptions.some((option) => option.id === row.color);
  return {
    look: {
      avatar: validAvatar && row.avatar ? row.avatar : fallback.avatar,
      color: validColor && row.color ? row.color : fallback.color,
    },
    id: row.id,
    userId: row.user_id,
    slug: row.slug,
    name: row.name,
    instructions: row.instructions,
    toolNames: JSON.parse(row.tool_names) as string[],
    builtIn: row.built_in === 1,
    routine:
      row.routine && row.routine_time
        ? {
            instruction: row.routine,
            time: row.routine_time,
            enabled: row.routine_enabled === 1,
            frequency: row.routine_frequency as Frequency,
            day: row.routine_day,
            lastRun: row.routine_last_day,
          }
        : null,
  };
}

function toTask(row: TaskRow): BotTask {
  return {
    id: row.id,
    botId: row.bot_id,
    instruction: row.instruction,
    status: row.status,
    result: row.result,
    source: row.source,
    createdAt: row.created_at,
    finishedAt: row.finished_at,
  };
}

const seededUsers = new Set<number>();

async function seedBuiltInBots(): Promise<void> {
  const userId = currentUserId();
  if (seededUsers.has(userId)) {
    return;
  }
  for (const bot of builtInBots) {
    await runStatement(
      "INSERT OR IGNORE INTO bots (user_id, slug, name, instructions, tool_names, built_in) VALUES (?, ?, ?, ?, ?, 1)",
      [userId, bot.slug, bot.name, bot.instructions, JSON.stringify(bot.toolNames)],
    );
  }
  for (const upgrade of substituteUpgrades) {
    await runStatement(
      "UPDATE bots SET name = ?, instructions = ?, built_in = 0 WHERE user_id = ? AND slug = ? AND name = ? AND built_in = 1",
      [upgrade.name, upgrade.instructions, userId, upgrade.slug, upgrade.oldName],
    );
  }
  seededUsers.add(userId);
}

export async function listBots(): Promise<Bot[]> {
  await seedBuiltInBots();
  const rows = await queryRows<BotRow>("SELECT * FROM bots WHERE user_id = ? ORDER BY built_in DESC, id", [
    currentUserId(),
  ]);
  return rows.map(toBot);
}

export async function getBot(id: number): Promise<Bot | null> {
  await seedBuiltInBots();
  const row = await queryRow<BotRow>("SELECT * FROM bots WHERE id = ? AND user_id = ?", [id, currentUserId()]);
  return row ? toBot(row) : null;
}

function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 30);
  return slug.length > 0 ? slug : "bot";
}

export async function createBot(input: BotInput): Promise<Bot> {
  const existing = await listBots();
  if (existing.length >= maxBots) {
    throw new AgentError(`You can have up to ${maxBots} Doombots. Delete one first.`);
  }
  const taken = new Set(existing.map((bot) => bot.slug));
  const base = slugify(input.name);
  let slug = base;
  for (let counter = 2; taken.has(slug); counter++) {
    slug = `${base}_${counter}`;
  }
  const look = { ...defaultLook(existing.length), ...input.look };
  const row = await queryRow<BotRow>(
    `INSERT INTO bots (user_id, slug, name, instructions, tool_names, built_in, routine, routine_time, routine_enabled, routine_frequency, routine_day, avatar, color)
     VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
    [
      currentUserId(),
      slug,
      input.name,
      input.instructions,
      JSON.stringify(input.toolNames),
      input.routine?.instruction ?? null,
      input.routine?.time ?? null,
      input.routine ? 1 : 0,
      input.routine?.frequency ?? "daily",
      input.routine?.day ?? null,
      look.avatar,
      look.color,
    ],
  );
  return toBot(row as BotRow);
}

export interface BotProfileChange {
  name?: string;
  look: Partial<BotLook>;
}

export async function updateBotProfile(botId: number, change: BotProfileChange): Promise<Bot | null> {
  const current = await getBot(botId);
  if (!current) {
    return null;
  }
  const look = { ...current.look, ...change.look };
  await runStatement("UPDATE bots SET name = ?, avatar = ?, color = ? WHERE id = ? AND user_id = ?", [
    change.name ?? current.name,
    look.avatar,
    look.color,
    botId,
    currentUserId(),
  ]);
  return getBot(botId);
}

export async function setRoutine(
  botId: number,
  routine: BotRoutineInput | null,
  enabled: boolean,
): Promise<Bot | null> {
  await runStatement(
    "UPDATE bots SET routine = ?, routine_time = ?, routine_enabled = ?, routine_frequency = ?, routine_day = ? WHERE id = ? AND user_id = ?",
    [
      routine?.instruction ?? null,
      routine?.time ?? null,
      routine && enabled ? 1 : 0,
      routine?.frequency ?? "daily",
      routine?.day ?? null,
      botId,
      currentUserId(),
    ],
  );
  return getBot(botId);
}

export async function updateBotDetails(
  botId: number,
  change: { instructions?: string; toolNames?: string[] },
): Promise<Bot | null> {
  const current = await getBot(botId);
  if (!current) {
    return null;
  }
  await runStatement("UPDATE bots SET instructions = ?, tool_names = ? WHERE id = ? AND user_id = ?", [
    change.instructions ?? current.instructions,
    JSON.stringify(change.toolNames ?? current.toolNames),
    botId,
    currentUserId(),
  ]);
  return getBot(botId);
}

export async function listRoutineBots(): Promise<Bot[]> {
  const rows = await queryRows<BotRow>(
    `SELECT b.* FROM bots b JOIN users u ON u.id = b.user_id
     WHERE b.routine_enabled = 1 AND b.routine IS NOT NULL AND b.routine_time IS NOT NULL
       AND u.google_sub NOT LIKE 'guest:%'`,
  );
  return rows.map(toBot);
}

export async function markRoutineRan(botId: number, period: string): Promise<void> {
  await runStatement("UPDATE bots SET routine_last_day = ? WHERE id = ?", [period, botId]);
}

export async function deleteBot(id: number): Promise<void> {
  const userId = currentUserId();
  await runStatement("DELETE FROM bot_messages WHERE bot_id = ? AND user_id = ?", [id, userId]);
  await runStatement("DELETE FROM bot_memories WHERE bot_id = ? AND user_id = ?", [id, userId]);
  await runStatement("DELETE FROM bot_tasks WHERE bot_id = ? AND user_id = ?", [id, userId]);
  await runStatement("DELETE FROM bots WHERE id = ? AND user_id = ? AND built_in = 0", [id, userId]);
}

export async function createTask(botId: number, instruction: string, source: TaskSource): Promise<BotTask> {
  const row = await queryRow<TaskRow>(
    "INSERT INTO bot_tasks (user_id, bot_id, instruction, source) VALUES (?, ?, ?, ?) RETURNING *",
    [currentUserId(), botId, instruction, source],
  );
  return toTask(row as TaskRow);
}

export async function finishTask(id: number, status: "done" | "failed", result: string): Promise<BotTask> {
  const row = await queryRow<TaskRow>(
    "UPDATE bot_tasks SET status = ?, result = ?, finished_at = datetime('now') WHERE id = ? AND user_id = ? RETURNING *",
    [status, result, id, currentUserId()],
  );
  return toTask(row as TaskRow);
}

export interface BotActivity {
  running: number;
  total: number;
  failed: number;
  lastStatus: string | null;
  lastAt: string | null;
}

export async function getBotActivity(botId: number): Promise<BotActivity> {
  const userId = currentUserId();
  const counts = (await queryRow<{ total: number; running: number; failed: number; last_at: string | null }>(
    `SELECT COUNT(*) AS total, COALESCE(SUM(status = 'running'), 0) AS running,
            COALESCE(SUM(status = 'failed'), 0) AS failed, MAX(COALESCE(finished_at, created_at)) AS last_at
     FROM bot_tasks WHERE bot_id = ? AND user_id = ?`,
    [botId, userId],
  )) as { total: number; running: number; failed: number; last_at: string | null };
  const last = await queryRow<{ status: string }>(
    "SELECT status FROM bot_tasks WHERE bot_id = ? AND user_id = ? ORDER BY id DESC LIMIT 1",
    [botId, userId],
  );
  return {
    running: counts.running,
    total: counts.total,
    failed: counts.failed,
    lastStatus: last?.status ?? null,
    lastAt: counts.last_at,
  };
}

export async function getAllBotActivity(): Promise<Map<number, BotActivity>> {
  const userId = currentUserId();
  const rows = await queryRows<{
    bot_id: number;
    total: number;
    running: number;
    failed: number;
    last_at: string | null;
    last_status: string | null;
  }>(
    `SELECT bot_id, COUNT(*) AS total, COALESCE(SUM(status = 'running'), 0) AS running,
            COALESCE(SUM(status = 'failed'), 0) AS failed, MAX(COALESCE(finished_at, created_at)) AS last_at,
            (SELECT status FROM bot_tasks latest WHERE latest.bot_id = bot_tasks.bot_id AND latest.user_id = ?
             ORDER BY latest.id DESC LIMIT 1) AS last_status
     FROM bot_tasks WHERE user_id = ? GROUP BY bot_id`,
    [userId, userId],
  );
  return new Map(
    rows.map((row) => [
      row.bot_id,
      { running: row.running, total: row.total, failed: row.failed, lastStatus: row.last_status, lastAt: row.last_at },
    ]),
  );
}

export async function getTask(id: number): Promise<BotTask | null> {
  const row = await queryRow<TaskRow>("SELECT * FROM bot_tasks WHERE id = ? AND user_id = ?", [id, currentUserId()]);
  return row ? toTask(row) : null;
}

export async function deleteTask(id: number): Promise<void> {
  await runStatement("DELETE FROM bot_tasks WHERE id = ? AND user_id = ?", [id, currentUserId()]);
}

export async function resetTask(id: number, instruction: string): Promise<BotTask> {
  const row = await queryRow<TaskRow>(
    "UPDATE bot_tasks SET instruction = ?, status = 'running', result = NULL, finished_at = NULL WHERE id = ? AND user_id = ? RETURNING *",
    [instruction, id, currentUserId()],
  );
  return toTask(row as TaskRow);
}

export async function listRecentTasks(limit: number, botId: number | null): Promise<BotTask[]> {
  const rows =
    botId === null
      ? await queryRows<TaskRow>("SELECT * FROM bot_tasks WHERE user_id = ? ORDER BY id DESC LIMIT ?", [
          currentUserId(),
          limit,
        ])
      : await queryRows<TaskRow>(
          "SELECT * FROM bot_tasks WHERE user_id = ? AND bot_id = ? ORDER BY id DESC LIMIT ?",
          [currentUserId(), botId, limit],
        );
  return rows.map(toTask);
}

export async function listTasks(botId: number, limit: number): Promise<BotTask[]> {
  const rows = await queryRows<TaskRow>(
    "SELECT * FROM bot_tasks WHERE bot_id = ? AND user_id = ? ORDER BY id DESC LIMIT ?",
    [botId, currentUserId(), limit],
  );
  return rows.map(toTask);
}

export async function listMemories(botId: number): Promise<BotMemory[]> {
  const rows = await queryRows<MemoryRow>("SELECT * FROM bot_memories WHERE bot_id = ? AND user_id = ? ORDER BY id", [
    botId,
    currentUserId(),
  ]);
  return rows.map((row) => ({
    id: row.id,
    botId: row.bot_id,
    fact: row.fact,
    createdAt: row.created_at,
  }));
}

export async function addMemory(botId: number, fact: string): Promise<void> {
  await runStatement("INSERT INTO bot_memories (user_id, bot_id, fact) VALUES (?, ?, ?)", [
    currentUserId(),
    botId,
    fact,
  ]);
}

export async function deleteMemory(botId: number, memoryId: number): Promise<void> {
  await runStatement("DELETE FROM bot_memories WHERE id = ? AND bot_id = ? AND user_id = ?", [
    memoryId,
    botId,
    currentUserId(),
  ]);
}

export async function loadBotMessages(botId: number, limit: number): Promise<BotMessage[]> {
  const rows = await queryRows<BotMessage>(
    "SELECT role, content FROM bot_messages WHERE bot_id = ? AND user_id = ? ORDER BY id DESC LIMIT ?",
    [botId, currentUserId(), limit],
  );
  return [...rows].reverse();
}

export async function saveBotMessage(botId: number, role: "user" | "assistant", content: string): Promise<void> {
  await runStatement("INSERT INTO bot_messages (user_id, bot_id, role, content) VALUES (?, ?, ?, ?)", [
    currentUserId(),
    botId,
    role,
    content,
  ]);
}
