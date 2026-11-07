"use client";

import { usePathname } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { Icon } from "@/components/icon";
import { messagesFor } from "@/components/status-actions";
import { dismissStatus, readStatus, startStatus, subscribeStatus } from "@/components/status-store";

const globalForStatus = globalThis as unknown as { doombotFetchWatched?: boolean };

function watchRequests(): void {
  if (globalForStatus.doombotFetchWatched) {
    return;
  }
  globalForStatus.doombotFetchWatched = true;
  const original = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const method = init?.method ?? (input instanceof Request ? input.method : "GET");
    const raw = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const url = new URL(raw, window.location.origin);
    const known = url.origin === window.location.origin ? messagesFor(method, url.pathname) : null;
    if (!known) {
      return original(input, init);
    }
    const handle = startStatus(known.working);
    try {
      const response = await original(input, init);
      if (response.ok) {
        handle.done(known.done);
      } else {
        handle.fail(known.fail);
      }
      return response;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        handle.done("Stopped");
      } else {
        handle.fail(known.fail);
      }
      throw error;
    }
  };
}

function Dots() {
  return (
    <span aria-hidden className="flex shrink-0 items-center gap-1">
      <span className="typing-dot h-1.5 w-1.5 rounded-full bg-doom" />
      <span className="typing-dot h-1.5 w-1.5 rounded-full bg-doom" />
      <span className="typing-dot h-1.5 w-1.5 rounded-full bg-doom" />
    </span>
  );
}

export function StatusPill({ floating = false }: { floating?: boolean }) {
  const pathname = usePathname();
  const status = useSyncExternalStore(subscribeStatus, readStatus, () => null);

  useEffect(() => {
    watchRequests();
  }, []);

  if (!status || (floating && pathname === "/")) {
    return null;
  }

  const pill = (
    <div
      role={status.tone === "error" ? "alert" : "status"}
      className={`flex h-9 max-w-full min-w-0 items-center gap-2.5 rounded-full border bg-raised px-3.5 text-sm text-ink ${
        status.tone === "error" ? "border-danger/60" : "border-line"
      }`}
    >
      {status.tone === "working" && <Dots />}
      {status.tone === "done" && <Icon name="check" size={18} className="text-doom" />}
      {status.tone === "error" && <Icon name="error" size={18} className="text-danger" />}
      <span className="min-w-0 truncate whitespace-nowrap">{status.label}</span>
      {status.tone === "error" && (
        <button type="button" onClick={dismissStatus} aria-label="Dismiss" className="-mr-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted hover:text-ink">
          <Icon name="close" size={16} />
        </button>
      )}
    </div>
  );

  if (floating) {
    return (
      <div className="pointer-events-none fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 flex justify-center px-4">
        <div className="pointer-events-auto flex max-w-[min(32rem,100%)] min-w-0">{pill}</div>
      </div>
    );
  }

  return <div className="mx-auto mb-2 flex w-full max-w-3xl min-w-0 justify-center">{pill}</div>;
}
