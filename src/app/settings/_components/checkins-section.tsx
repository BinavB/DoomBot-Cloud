"use client";

import { useEffect, useState } from "react";
import { PageNotice } from "@/components/page-notice";

const maxTimes = 6;

export function CheckinsSection() {
  const [enabled, setEnabled] = useState(false);
  const [times, setTimes] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState<{ text: string; tone: "success" | "error" } | null>(null);

  useEffect(() => {
    fetch("/api/checkins")
      .then((response) => response.json() as Promise<{ enabled: boolean; times: string[] }>)
      .then((data) => {
        setEnabled(data.enabled);
        setTimes(data.times);
      })
      .catch(() => setMessage({ text: "Check-ins could not load. Reload the page to try again.", tone: "error" }))
      .finally(() => setLoaded(true));
  }, []);

  async function save() {
    setMessage(null);
    const response = await fetch("/api/checkins", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled, times: times.filter((time) => time.length > 0) }),
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setMessage(
      response.ok
        ? { text: "Check-ins saved.", tone: "success" }
        : { text: data.error ?? "The check-ins could not be saved. Try again.", tone: "error" },
    );
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-line bg-panel p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold">Check-ins</h2>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Check in on me"
          onClick={() => setEnabled((current) => !current)}
          disabled={!loaded}
          className={`h-7 w-12 rounded-full p-1 transition-colors ${enabled ? "bg-doom" : "bg-raised"}`}
        >
          <span className={`block h-5 w-5 rounded-full bg-canvas transition-transform ${enabled ? "translate-x-5" : ""}`} />
        </button>
      </div>
      <p className="text-sm text-muted">
        At these times DOOMBOT looks at your to-dos, calendar and mail. It sends one short note if something needs you, and stays silent otherwise.
      </p>
      {message && <PageNotice tone={message.tone === "success" ? "success" : "error"}>{message.text}</PageNotice>}
      <ul className="flex flex-col gap-2">
        {times.map((time, index) => (
          <li key={index} className="flex items-center gap-2">
            <input
              type="time"
              value={time}
              aria-label={`Check-in time ${index + 1}`}
              onChange={(event) =>
                setTimes((current) => current.map((item, position) => (position === index ? event.target.value : item)))
              }
              className="h-11 rounded-xl border border-line bg-transparent px-3 text-base outline-none focus:border-doom md:text-[15px]"
            />
            <button
              type="button"
              onClick={() => setTimes((current) => current.filter((_, position) => position !== index))}
              className="rounded-lg px-2 py-1 text-xs text-muted hover:bg-raised hover:text-danger"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setTimes((current) => [...current, "12:00"])}
          disabled={times.length >= maxTimes}
          className="h-10 rounded-xl border border-line px-4 text-sm font-medium hover:bg-raised disabled:opacity-40"
        >
          Add a time
        </button>
        <button
          type="button"
          onClick={() => void save()}
          className="h-10 rounded-xl bg-doom px-4 text-sm font-semibold text-canvas"
        >
          Save check-ins
        </button>
      </div>
    </section>
  );
}
