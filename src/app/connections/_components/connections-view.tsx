"use client";

import { useState, useSyncExternalStore } from "react";
import { GoogleConnection } from "@/app/connections/_components/google-connection";
import { NotionConnection } from "@/app/connections/_components/notion-connection";
import { PageNotice } from "@/components/page-notice";
import { useConnectedApps, type ConnectedApp } from "@/components/use-connected-apps";

interface Note {
  text: string;
  tone: "success" | "error";
}

const googleNotes: Record<string, Note> = {
  connected: { text: "Google connected.", tone: "success" },
  denied: { text: "Google access was not granted. Connect again and approve access.", tone: "error" },
  error: { text: "Google sign-in failed. Connect again to retry.", tone: "error" },
};

const notionNotes: Record<string, Note> = {
  connected: { text: "Notion connected. Pages you share with DOOMBOT can now be read.", tone: "success" },
  denied: { text: "Notion was not connected. You did not allow access.", tone: "error" },
  error: { text: "Notion could not be connected. Try again.", tone: "error" },
};

function subscribeToLocation(onChange: () => void): () => void {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
}

function readGoogleResult(): string | null {
  return new URLSearchParams(window.location.search).get("google");
}

function readNotionResult(): string | null {
  return new URLSearchParams(window.location.search).get("notion");
}

export function ConnectionsView() {
  const { status, error, disconnect } = useConnectedApps();
  const googleResult = useSyncExternalStore(subscribeToLocation, readGoogleResult, () => null);
  const notionResult = useSyncExternalStore(subscribeToLocation, readNotionResult, () => null);
  const [note, setNote] = useState<Note | null>(null);
  const urlNote = (googleResult ? googleNotes[googleResult] : undefined) ?? (notionResult ? notionNotes[notionResult] : undefined);
  const shownNote = note ?? urlNote ?? null;

  async function disconnectApp(app: ConnectedApp, name: string) {
    if (await disconnect(app)) {
      setNote({ text: `${name} is disconnected.`, tone: "success" });
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 md:px-6">
      {error && <PageNotice tone="error">{error}</PageNotice>}
      {shownNote && <PageNotice tone={shownNote.tone}>{shownNote.text}</PageNotice>}
      <GoogleConnection connected={status?.google ?? null} onDisconnect={() => void disconnectApp("google", "Google")} />
      <NotionConnection
        connected={status?.notion ?? null}
        available={status?.notionAvailable ?? false}
        onDisconnect={() => void disconnectApp("notion", "Notion")}
      />
    </div>
  );
}
