import { createClient, type Client, type InValue } from "@libsql/client";
import { config } from "@/lib/config";

const schema = `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    google_sub TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    picture TEXT,
    session_version INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_seen_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    conversation_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS messages_user_conversation_index ON messages (user_id, conversation_id, id);

  CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    done INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS todos_user_index ON todos (user_id, id);

  CREATE TABLE IF NOT EXISTS approvals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    tool TEXT NOT NULL,
    summary TEXT NOT NULL,
    arguments TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    result TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    resolved_at TEXT
  );
  CREATE INDEX IF NOT EXISTS approvals_user_status_index ON approvals (user_id, status, id);

  CREATE TABLE IF NOT EXISTS briefings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    day TEXT NOT NULL,
    content TEXT NOT NULL,
    summarized_by_ai INTEGER NOT NULL,
    provider TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS briefings_user_day_index ON briefings (user_id, day);

  CREATE TABLE IF NOT EXISTS usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    day TEXT NOT NULL,
    model TEXT NOT NULL,
    prompt_tokens INTEGER NOT NULL,
    completion_tokens INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS usage_user_day_index ON usage (user_id, day);

  CREATE TABLE IF NOT EXISTS bots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    slug TEXT NOT NULL,
    name TEXT NOT NULL,
    instructions TEXT NOT NULL,
    tool_names TEXT NOT NULL,
    built_in INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    routine TEXT,
    routine_time TEXT,
    routine_enabled INTEGER NOT NULL DEFAULT 0,
    routine_last_day TEXT,
    avatar TEXT,
    color TEXT,
    routine_frequency TEXT NOT NULL DEFAULT 'daily',
    routine_day INTEGER,
    UNIQUE (user_id, slug)
  );

  CREATE TABLE IF NOT EXISTS bot_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    bot_id INTEGER NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS bot_messages_bot_index ON bot_messages (bot_id, id);

  CREATE TABLE IF NOT EXISTS bot_memories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    bot_id INTEGER NOT NULL,
    fact TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS bot_memories_bot_index ON bot_memories (bot_id, id);

  CREATE TABLE IF NOT EXISTS bot_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    bot_id INTEGER NOT NULL,
    instruction TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'running',
    result TEXT,
    source TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    finished_at TEXT
  );
  CREATE INDEX IF NOT EXISTS bot_tasks_bot_index ON bot_tasks (bot_id, id);

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    bot_id INTEGER,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    urgent INTEGER NOT NULL DEFAULT 0,
    read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS notifications_user_read_index ON notifications (user_id, read, id);

  CREATE TABLE IF NOT EXISTS push_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS push_subscriptions_user_index ON push_subscriptions (user_id);

  CREATE TABLE IF NOT EXISTS conversations (
    user_id INTEGER NOT NULL,
    id TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT 'New chat',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, id)
  );

  CREATE TABLE IF NOT EXISTS shared_chats (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    conversation_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (user_id, conversation_id)
  );

  CREATE TABLE IF NOT EXISTS message_feedback (
    user_id INTEGER NOT NULL,
    message_id INTEGER NOT NULL,
    rating INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, message_id)
  );

  CREATE TABLE IF NOT EXISTS rate_limits (
    user_id INTEGER NOT NULL,
    window_start INTEGER NOT NULL,
    hits INTEGER NOT NULL,
    PRIMARY KEY (user_id, window_start)
  );

  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS notes_user_index ON notes (user_id, id);

  CREATE TABLE IF NOT EXISTS suggestions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    prompt TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS suggestions_user_index ON suggestions (user_id, status, id);

  CREATE TABLE IF NOT EXISTS skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    instructions TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (user_id, name)
  );

  CREATE TABLE IF NOT EXISTS user_memories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    fact TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS user_memories_user_index ON user_memories (user_id, id);

  CREATE TABLE IF NOT EXISTS user_locations (
    user_id INTEGER PRIMARY KEY,
    city TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS user_timezones (
    user_id INTEGER PRIMARY KEY,
    time_zone TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS user_settings (
    user_id INTEGER PRIMARY KEY,
    custom_instructions TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS user_briefing_topics (
    user_id INTEGER PRIMARY KEY,
    topics TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS google_tokens (
    user_id INTEGER PRIMARY KEY,
    refresh_token TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`;

export type SqlArgs = InValue[];

const globalForDatabase = globalThis as unknown as {
  doombotClient?: Client;
  doombotReady?: Promise<Client>;
};

async function openDatabase(): Promise<Client> {
  const client = createClient({
    url: config.databaseUrl,
    authToken: config.databaseToken || undefined,
  });
  await client.executeMultiple(schema);
  await client
    .execute("ALTER TABLE conversations ADD COLUMN title_locked INTEGER NOT NULL DEFAULT 0")
    .catch(() => undefined);
  await client.execute(
    "UPDATE bot_tasks SET status = 'failed', result = 'Interrupted by a server restart.', finished_at = datetime('now') WHERE status = 'running'",
  );
  globalForDatabase.doombotClient = client;
  return client;
}

function database(): Promise<Client> {
  globalForDatabase.doombotReady ??= openDatabase().catch((error: unknown) => {
    globalForDatabase.doombotReady = undefined;
    throw error;
  });
  return globalForDatabase.doombotReady;
}

export async function queryRows<Row>(sql: string, args: SqlArgs = []): Promise<Row[]> {
  const result = await (await database()).execute({ sql, args });
  return result.rows as unknown as Row[];
}

export async function queryRow<Row>(sql: string, args: SqlArgs = []): Promise<Row | undefined> {
  return (await queryRows<Row>(sql, args))[0];
}

export async function runStatement(sql: string, args: SqlArgs = []): Promise<void> {
  await (await database()).execute({ sql, args });
}
