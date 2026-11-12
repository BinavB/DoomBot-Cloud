"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PageNotice } from "@/components/page-notice";

interface Status {
  google: boolean;
  notion: boolean;
  notionAvailable: boolean;
}

interface Note {
  tone: "success" | "error";
  text: string;
}

const notionResultNotes: Record<string, Note> = {
  connected: { tone: "success", text: "Notion is connected. Pages you share with DOOMBOT can now be read." },
  denied: { tone: "error", text: "Notion was not connected. You did not allow access." },
  error: { tone: "error", text: "Notion could not be connected. Try again." },
};

export function ConnectedAppsSection() {
  const result = useSearchParams().get("notion");
  const [status, setStatus] = useState<Status | null>(null);
  const [note, setNote] = useState<Note | null>(null);
  const [error, setError] = useState<string | null>(null);
  const shownNote = note ?? (result ? notionResultNotes[result] : undefined) ?? null;

  useEffect(() => {
    fetch("/api/connected-apps")
      .then((response) => response.json() as Promise<Status>)
      .then(setStatus)
      .catch(() => setError("Connected apps could not load. Reload the page to try again."));
  }, []);

  async function disconnectNotion() {
    setNote(null);
    setError(null);
    const response = await fetch("/api/connected-apps", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ app: "notion" }),
    });
    if (!response.ok) {
      setError("Notion could not be disconnected. Try again.");
      return;
    }
    setStatus((current) => (current ? { ...current, notion: false } : current));
    setNote({ tone: "success", text: "Notion is disconnected." });
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-line bg-panel p-5">
      <h2 className="font-display text-lg font-semibold">Connected apps</h2>
      <p className="text-sm text-muted">DOOMBOT can read these apps. It only reads, and it never changes files in them.</p>
      {error && <PageNotice tone="error">{error}</PageNotice>}
      {shownNote && <PageNotice tone={shownNote.tone === "success" ? "success" : "error"}>{shownNote.text}</PageNotice>}

      <div className="flex flex-col gap-2 border-t border-line pt-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold">Google Drive</span>
          <span className="text-xs text-muted">{status?.google ? "Connected with Google" : "Connect Google first"}</span>
        </div>
        <p className="text-sm text-muted">
          Drive uses your Google connection. If Drive asks for permission, connect Google again on the{" "}
          <Link href="/connections" className="font-medium text-doom underline underline-offset-2">
            Connections
          </Link>{" "}
          page.
        </p>
      </div>

      <div className="flex flex-col gap-3 border-t border-line pt-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold">Notion</span>
          <span className="text-xs text-muted">{status?.notion ? "Connected" : "Not connected"}</span>
        </div>
        {status && !status.notionAvailable && (
          <p className="text-sm text-muted">Notion sign-in is not set up on this server yet.</p>
        )}
        {status?.notion && (
          <button
            type="button"
            onClick={() => void disconnectNotion()}
            className="h-10 w-fit rounded-xl border border-line px-4 text-sm font-medium hover:bg-raised"
          >
            Disconnect Notion
          </button>
        )}
        {status && !status.notion && status.notionAvailable && (
          <a
            href="/api/notion/connect"
            className="flex h-10 w-fit items-center rounded-xl bg-doom px-4 text-sm font-semibold text-canvas"
          >
            Connect Notion
          </a>
        )}
      </div>
    </section>
  );
}
