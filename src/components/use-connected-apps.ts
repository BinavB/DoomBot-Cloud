"use client";

import { useEffect, useState } from "react";

export type ConnectedApp = "google" | "notion";

export interface ConnectedAppsStatus {
  google: boolean;
  notion: boolean;
  notionAvailable: boolean;
}

export function useConnectedApps() {
  const [status, setStatus] = useState<ConnectedAppsStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/connected-apps")
      .then((response) => response.json() as Promise<ConnectedAppsStatus>)
      .then(setStatus)
      .catch(() => setError("Connections could not load. Reload the page to try again."));
  }, []);

  async function disconnect(app: ConnectedApp): Promise<boolean> {
    setError(null);
    const response = await fetch("/api/connected-apps", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ app }),
    });
    if (!response.ok) {
      setError("That app could not be disconnected. Try again.");
      return false;
    }
    setStatus((current) => (current ? { ...current, [app]: false } : current));
    return true;
  }

  return { status, error, disconnect };
}
