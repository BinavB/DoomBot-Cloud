import { config, type AiProvider } from "@/lib/config";
import { AgentError, ProviderHttpError } from "@/lib/errors";
import { currentUserIsGuest } from "@/lib/auth/context";
import { guestDailyTokenLimit, guestsDailyTokenBudget } from "@/lib/auth/guest-limits";
import { guestTokensUsedToday, recordUsage, tokensUsedToday } from "@/lib/usage";

export interface ToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

export type ContentPart = { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } };

export type ChatMessage =
  | { role: "system"; content: string }
  | { role: "user"; content: string | ContentPart[] }
  | { role: "assistant"; content: string | null; tool_calls?: ToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };

export interface ToolSpec {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface Completion {
  content: string | null;
  toolCalls: ToolCall[];
  provider: string;
  model: string;
}

export interface CompletionOptions {
  onToken?: (text: string) => void;
  signal?: AbortSignal;
  reasoningEffort?: "low" | "high";
}

interface CompletionResponse {
  choices: {
    message: { content: string | null; tool_calls?: ToolCall[] };
  }[];
  usage?: { prompt_tokens: number; completion_tokens: number };
}

const retryableStatuses = new Set([500, 502, 503, 504]);
const retryDelayMilliseconds = 2000;

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function requestSignal(external?: AbortSignal): AbortSignal {
  const timeout = AbortSignal.timeout(30000);
  return external ? AbortSignal.any([timeout, external]) : timeout;
}

const imageTokenCost = 1500;

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function estimatePromptTokens(messages: ChatMessage[]): number {
  let total = 0;
  for (const message of messages) {
    if (typeof message.content === "string") {
      total += estimateTokens(message.content);
    } else if (Array.isArray(message.content)) {
      for (const part of message.content) {
        total += part.type === "text" ? estimateTokens(part.text) : imageTokenCost;
      }
    }
  }
  return total;
}

interface StreamState {
  content: string;
  calls: StreamedToolCall[];
}

interface StreamedToolCall {
  id: string;
  name: string;
  arguments: string;
}

interface StreamChunk {
  choices?: {
    delta?: {
      content?: string | null;
      tool_calls?: { index?: number; id?: string; function?: { name?: string; arguments?: string } }[];
    };
  }[];
}

function applyChunk(chunk: StreamChunk, state: StreamState, onToken: (text: string) => void): void {
  const delta = chunk.choices?.[0]?.delta;
  if (!delta) {
    return;
  }
  if (delta.content) {
    state.content += delta.content;
    onToken(delta.content);
  }
  for (const call of delta.tool_calls ?? []) {
    const target = (state.calls[call.index ?? 0] ??= { id: "", name: "", arguments: "" });
    target.id = call.id || target.id;
    target.name += call.function?.name ?? "";
    target.arguments += call.function?.arguments ?? "";
  }
}

async function readStream(
  response: Response,
  onToken: (text: string) => void,
  state: StreamState,
): Promise<{ content: string; toolCalls: ToolCall[] }> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new AgentError("returned an empty response");
  }
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) {
        continue;
      }
      const payload = trimmed.slice(5).trim();
      if (payload !== "[DONE]") {
        applyChunk(JSON.parse(payload) as StreamChunk, state, onToken);
      }
    }
  }

  const toolCalls = state.calls
    .filter((call) => call.name.length > 0)
    .map((call) => ({
      id: call.id || `call_${call.name}`,
      type: "function" as const,
      function: { name: call.name, arguments: call.arguments || "{}" },
    }));
  return { content: state.content, toolCalls };
}

async function requestCompletion(
  provider: AiProvider,
  model: string,
  messages: ChatMessage[],
  tools: ToolSpec[] | undefined,
  options: CompletionOptions,
): Promise<Completion> {
  const streaming = options.onToken !== undefined;
  const response = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      ...(tools && tools.length > 0 ? { tools } : {}),
      stream: streaming,
      ...(provider.name === "gemini" && options.reasoningEffort ? { reasoning_effort: options.reasoningEffort } : {}),
    }),
    signal: requestSignal(options.signal),
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 300);
    throw new ProviderHttpError(response.status, `request failed (${response.status}): ${detail}`);
  }

  if (options.onToken) {
    const state: StreamState = { content: "", calls: [] };
    try {
      const streamed = await readStream(response, options.onToken, state);
      return {
        content: streamed.content || null,
        toolCalls: streamed.toolCalls,
        provider: provider.name,
        model,
      };
    } finally {
      const completionText = state.content + JSON.stringify(state.calls);
      await recordUsage(`${provider.name}/${model}`, estimatePromptTokens(messages), estimateTokens(completionText));
    }
  }

  const body = (await response.json()) as CompletionResponse;
  const message = body.choices[0]?.message;
  if (!message) {
    throw new AgentError("returned an empty response");
  }

  if (body.usage) {
    await recordUsage(
      `${provider.name}/${model}`,
      body.usage.prompt_tokens,
      body.usage.completion_tokens,
    );
  }

  return {
    content: message.content,
    toolCalls: message.tool_calls ?? [],
    provider: provider.name,
    model,
  };
}

async function requestWithRetry(
  provider: AiProvider,
  model: string,
  messages: ChatMessage[],
  tools: ToolSpec[] | undefined,
  options: CompletionOptions,
): Promise<Completion> {
  try {
    return await requestCompletion(provider, model, messages, tools, options);
  } catch (error) {
    if (error instanceof ProviderHttpError && retryableStatuses.has(error.status)) {
      await delay(retryDelayMilliseconds);
      return requestCompletion(provider, model, messages, tools, options);
    }
    throw error;
  }
}

export async function createChatCompletion(
  messages: ChatMessage[],
  tools?: ToolSpec[],
  options: CompletionOptions = {},
): Promise<Completion> {
  const providers = config.aiProviders.filter((provider) => provider.apiKey);
  if (providers.length === 0) {
    throw new AgentError(
      "DOOMBOT cannot answer right now. Try again later.",
    );
  }
  if (currentUserIsGuest()) {
    const [own, everyone] = await Promise.all([tokensUsedToday(), guestTokensUsedToday()]);
    if (own >= guestDailyTokenLimit || everyone >= guestsDailyTokenBudget) {
      throw new AgentError("Guest use is full for today. Sign in with Google to keep going, or come back tomorrow.");
    }
  } else if ((await tokensUsedToday()) >= config.dailyTokenLimit) {
    throw new AgentError(
      "You have reached today's limit. Try again tomorrow.",
    );
  }

  const failures: string[] = [];
  for (const provider of providers) {
    for (const model of provider.models) {
      try {
        return await requestWithRetry(provider, model, messages, tools, options);
      } catch (error) {
        if (options.signal?.aborted) {
          throw error;
        }
        const reason = error instanceof Error ? error.message : String(error);
        failures.push(`${provider.name}/${model}: ${reason.slice(0, 160)}`);
        if (error instanceof ProviderHttpError && [401, 402, 403].includes(error.status)) {
          break;
        }
      }
    }
  }
  console.error(`[ai] all providers failed: ${failures.join(" | ")}`);
  throw new AgentError(`All AI providers failed. ${failures.join(" | ")}`);
}
