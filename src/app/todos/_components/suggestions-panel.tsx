"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createChat, queuePrompt } from "@/components/chat-store";
import { PageNotice } from "@/components/page-notice";
import { jsonHeaders } from "./todo-types";

interface Suggestion {
  id: number;
  title: string;
  prompt: string;
}

export function SuggestionsPanel() {
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [finding, setFinding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/suggestions")
      .then((response) => response.json() as Promise<{ suggestions: Suggestion[] }>)
      .then((data) => setSuggestions(data.suggestions))
      .catch(() => setError("Suggestions could not load. Reload the page to try again."));
  }, []);

  async function findSuggestions() {
    setFinding(true);
    setError(null);
    const response = await fetch("/api/suggestions", { method: "POST" });
    const data = (await response.json().catch(() => ({}))) as { suggestions?: Suggestion[]; error?: string };
    setFinding(false);
    if (!response.ok || !data.suggestions) {
      setError(data.error ?? "Suggestions could not be made. Try again.");
      return;
    }
    setSuggestions(data.suggestions);
  }

  async function setStatus(id: number, status: "started" | "hidden") {
    await fetch("/api/suggestions", {
      method: "PATCH",
      headers: jsonHeaders,
      body: JSON.stringify({ id, status }),
    });
    setSuggestions((current) => (current ? current.filter((item) => item.id !== id) : current));
  }

  async function start(suggestion: Suggestion) {
    const chatId = await createChat();
    if (!chatId) {
      setError("A new chat could not be started. Try again.");
      return;
    }
    queuePrompt(suggestion.prompt);
    await setStatus(suggestion.id, "started");
    router.push("/");
  }

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-line bg-panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold">Suggestions</h2>
        <button
          type="button"
          onClick={() => void findSuggestions()}
          disabled={finding}
          className="h-10 rounded-xl border border-line px-4 text-sm font-medium hover:bg-raised disabled:opacity-40"
        >
          {finding ? "Looking..." : "Find suggestions"}
        </button>
      </div>
      <p className="text-sm text-muted">
        DOOMBOT looks at your to-dos, today&apos;s calendar and unread mail, then proposes up to 3 next steps. Nothing runs until you press Start.
      </p>
      {error && <PageNotice tone="error">{error}</PageNotice>}
      {suggestions && suggestions.length === 0 && !finding && (
        <p className="text-sm text-muted">No suggestions yet. Press Find suggestions.</p>
      )}
      <ul className="flex flex-col gap-2">
        {suggestions?.map((suggestion) => (
          <li key={suggestion.id} className="flex flex-col gap-2 rounded-xl border border-line px-3 py-3">
            <span className="text-sm font-semibold">{suggestion.title}</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void start(suggestion)}
                className="h-9 rounded-lg bg-doom px-3 text-sm font-semibold text-canvas"
              >
                Start
              </button>
              <button
                type="button"
                onClick={() => void setStatus(suggestion.id, "hidden")}
                className="h-9 rounded-lg px-3 text-sm text-muted hover:bg-raised"
              >
                Hide
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
