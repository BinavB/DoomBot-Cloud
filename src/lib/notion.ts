import { randomBytes } from "node:crypto";
import { currentUserId } from "@/lib/auth/context";
import { config } from "@/lib/config";
import { queryRow, runStatement } from "@/lib/database";
import { AgentError } from "@/lib/errors";
import { openSecret, sealSecret } from "@/lib/secret-box";

export const maxNotionTextLength = 8000;
export const notionRedirectPath = "/api/notion/callback";
export const notionStateCookieName = "doombot_notion_state";
export const notionStateLifetimeSeconds = 10 * 60;

const notionVersion = "2022-06-28";
const notionApp = "notion";
const notionIdPattern = /^[0-9a-f-]{32,36}$/i;

interface RichText {
  plain_text: string;
}

interface NotionObject {
  id: string;
  object: string;
  title?: RichText[];
  properties?: Record<string, { type: string; title?: RichText[] }>;
}

export function isNotionId(value: string): boolean {
  return notionIdPattern.test(value);
}

function joinText(parts: RichText[] | undefined): string {
  return (parts ?? []).map((part) => part.plain_text).join("");
}

export function notionObjectTitle(object: NotionObject): string {
  const titleProperty = Object.values(object.properties ?? {}).find((property) => property.type === "title");
  return joinText(object.title) || joinText(titleProperty?.title) || "(untitled)";
}

export function blocksToText(blocks: Record<string, unknown>[]): string {
  return blocks
    .map((block) => {
      const type = typeof block.type === "string" ? block.type : "";
      const content = block[type] as { rich_text?: RichText[] } | undefined;
      return joinText(content?.rich_text);
    })
    .filter((line) => line.length > 0)
    .join("\n");
}

export function isNotionSignInConfigured(): boolean {
  return config.notionClientId.length > 0 && config.notionClientSecret.length > 0;
}

export function createNotionAuthorizationUrl(): { url: string; state: string } {
  if (!isNotionSignInConfigured()) {
    throw new AgentError("NOTION_CLIENT_ID and NOTION_CLIENT_SECRET are missing in the environment.");
  }
  const state = randomBytes(24).toString("hex");
  const url = new URL("https://api.notion.com/v1/oauth/authorize");
  url.searchParams.set("client_id", config.notionClientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("owner", "user");
  url.searchParams.set("redirect_uri", `${config.appUrl}${notionRedirectPath}`);
  url.searchParams.set("state", state);
  return { url: url.toString(), state };
}

export async function exchangeNotionCode(code: string): Promise<void> {
  if (!isNotionSignInConfigured()) {
    throw new AgentError("NOTION_CLIENT_ID and NOTION_CLIENT_SECRET are missing in the environment.");
  }
  const basic = Buffer.from(`${config.notionClientId}:${config.notionClientSecret}`).toString("base64");
  const response = await fetch("https://api.notion.com/v1/oauth/token", {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri: `${config.appUrl}${notionRedirectPath}`,
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    throw new AgentError(`Notion sign-in failed (${response.status}). Try again.`);
  }
  const data = (await response.json()) as { access_token?: unknown };
  if (typeof data.access_token !== "string" || data.access_token.length === 0) {
    throw new AgentError("Notion did not return an access token. Try again.");
  }
  await runStatement(
    "INSERT INTO app_connections (user_id, app, secret) VALUES (?, ?, ?) ON CONFLICT (user_id, app) DO UPDATE SET secret = excluded.secret",
    [currentUserId(), notionApp, sealSecret(data.access_token)],
  );
}

export async function isNotionConnected(): Promise<boolean> {
  const row = await queryRow<{ app: string }>("SELECT app FROM app_connections WHERE user_id = ? AND app = ?", [
    currentUserId(),
    notionApp,
  ]);
  return row !== undefined;
}

async function notionToken(): Promise<string> {
  const row = await queryRow<{ secret: string }>("SELECT secret FROM app_connections WHERE user_id = ? AND app = ?", [
    currentUserId(),
    notionApp,
  ]);
  if (!row) {
    throw new AgentError("Notion is not connected. Connect Notion in Settings under Connected apps.");
  }
  const token = openSecret(row.secret);
  if (!token) {
    throw new AgentError("The saved Notion connection could not be read. Connect Notion again in Settings.");
  }
  return token;
}

async function notionRequest<T>(token: string, path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`https://api.notion.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": notionVersion,
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    throw new AgentError(`Notion request failed (${response.status}).`);
  }
  return (await response.json()) as T;
}

export async function disconnectNotion(): Promise<void> {
  await runStatement("DELETE FROM app_connections WHERE user_id = ? AND app = ?", [currentUserId(), notionApp]);
}

export async function searchNotion(query: string): Promise<string> {
  const token = await notionToken();
  const data = await notionRequest<{ results: NotionObject[] }>(token, "/search", {
    method: "POST",
    body: JSON.stringify({ query, page_size: 5 }),
  });
  if (data.results.length === 0) {
    return "No Notion pages match that search. Only pages the user shared with DOOMBOT can be found.";
  }
  return data.results
    .map((object) => `${notionObjectTitle(object)} | id: ${object.id} | ${object.object}`)
    .join("\n");
}

export async function readNotionPage(id: string): Promise<string> {
  if (!isNotionId(id)) {
    throw new AgentError('"page_id" must be an id from search_notion.');
  }
  const token = await notionToken();
  const data = await notionRequest<{ results: Record<string, unknown>[] }>(
    token,
    `/blocks/${encodeURIComponent(id)}/children?page_size=100`,
  );
  const text = blocksToText(data.results);
  return text.length > 0 ? text.slice(0, maxNotionTextLength) : "This page has no text in its first level of blocks.";
}
