"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { SetupItem, SetupStatus } from "@/lib/setup";

const statusLabels: Record<SetupStatus, { text: string; className: string }> = {
  ready: { text: "Ready", className: "text-doom" },
  needed: { text: "Needs setup", className: "text-danger" },
  optional: { text: "Optional", className: "text-muted" },
};

export function SetupSection() {
  const [items, setItems] = useState<SetupItem[] | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(() => {
    fetch("/api/setup")
      .then((response) => response.json() as Promise<{ items: SetupItem[] }>)
      .then((data) => {
        setItems(data.items);
        setFailed(false);
      })
      .catch(() => setFailed(true));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-line bg-panel p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold">Setup</h2>
        <button type="button" onClick={load} className="rounded-lg px-3 py-1.5 text-sm text-muted hover:bg-raised">
          Check again
        </button>
      </div>
      {failed && <p className="text-sm text-danger">The checklist could not load. Press Check again.</p>}
      <ul className="flex flex-col divide-y divide-line">
        {items?.map((item) => (
          <li key={item.id} className="flex items-start justify-between gap-3 py-3">
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-sm font-medium">{item.label}</span>
              <span className="text-sm text-muted">{item.detail}</span>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className={`text-xs font-semibold ${statusLabels[item.status].className}`}>
                {statusLabels[item.status].text}
              </span>
              {item.href && (
                <Link href={item.href} className="text-xs font-medium text-doom underline underline-offset-2">
                  Set up
                </Link>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
