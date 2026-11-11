import { AgentError } from "@/lib/errors";

const tavilyEndpoint = "https://api.tavily.com/search";
const maxResults = 5;

export interface WebResult {
  title: string;
  url: string;
  snippet: string;
}

interface TavilySearchResponse {
  results?: { title?: string; url?: string; content?: string }[];
}

function stripMarkup(text: string): string {
  return text.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

export function toWebResults(data: TavilySearchResponse): WebResult[] {
  return (data.results ?? [])
    .filter((item) => item.title && item.url)
    .slice(0, maxResults)
    .map((item) => ({
      title: stripMarkup(item.title ?? ""),
      url: item.url ?? "",
      snippet: stripMarkup(item.content ?? ""),
    }));
}

export function formatWebResults(results: WebResult[]): string {
  if (results.length === 0) {
    return "No web results found.";
  }
  return results.map((item, index) => `${index + 1}. ${item.title} (${item.url})\n${item.snippet}`).join("\n\n");
}

export async function searchWeb(query: string): Promise<WebResult[]> {
  const apiKey = process.env.TAVILY_API_KEY?.trim();
  if (!apiKey) {
    throw new AgentError("Web search is not set up yet.");
  }
  const response = await fetch(tavilyEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ query, max_results: maxResults, search_depth: "basic" }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) {
    throw new AgentError(`Web search failed (${response.status}).`);
  }
  return toWebResults((await response.json()) as TavilySearchResponse);
}
