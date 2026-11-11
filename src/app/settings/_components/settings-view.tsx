"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { PageNotice } from "@/components/page-notice";
import { Icon } from "@/components/icon";
import { BriefingTopicsPicker } from "@/components/briefing-topics-picker";
import { installApp, isInstalled, subscribeInstall } from "@/components/install-prompt";
import { defaultTopics, maxTopics, type TopicId } from "@/lib/briefing/topics";

interface Memory {
  id: number;
  fact: string;
  createdAt: string;
}

const timeZones = [
  "Asia/Dubai",
  "Europe/London",
  "Europe/Paris",
  "Africa/Cairo",
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "UTC",
];

interface SettingsData {
  customInstructions: string;
  timeZone: string;
  homeCity: string;
  memories: Memory[];
  maxInstructionsLength: number;
  briefingTopics: TopicId[];
}

export function SettingsView() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [instructions, setInstructions] = useState("");
  const router = useRouter();
  const installed = useSyncExternalStore(subscribeInstall, isInstalled, () => false);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [timeZone, setTimeZone] = useState("Asia/Dubai");
  const [homeCity, setHomeCity] = useState("");
  const [topics, setTopics] = useState<TopicId[]>(defaultTopics);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((response) => response.json() as Promise<SettingsData>)
      .then((loaded) => {
        setData(loaded);
        setInstructions(loaded.customInstructions);
        setTimeZone(loaded.timeZone);
        setHomeCity(loaded.homeCity);
        setTopics(loaded.briefingTopics);
      })
      .catch(() => setError("Settings could not load. Reload the page to try again."));
  }, []);

  async function saveSettings() {
    setMessage(null);
    setError(null);
    const response = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customInstructions: instructions, timeZone, homeCity, briefingTopics: topics }),
    });
    const saved = (await response.json().catch(() => ({}))) as { error?: string };
    setMessage(response.ok ? "Saved. Briefings and routines now follow these settings." : saved.error ?? "Could not save. Try again.");
  }

  async function deleteEverything() {
    const response = await fetch("/api/account/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: "DELETE" }),
    });
    if (response.ok) {
      router.replace("/login");
    } else {
      setError("Your data could not be deleted. Try again.");
    }
  }

  async function forget(id: number) {
    const response = await fetch("/api/memories", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (response.ok) {
      setData((current) => (current ? { ...current, memories: current.memories.filter((item) => item.id !== id) } : current));
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
      {error && <PageNotice tone="error">{error}</PageNotice>}

      <section className="flex flex-col gap-3 rounded-2xl border border-line bg-panel p-5">
        <h2 className="font-display text-lg font-semibold">Home city and time zone</h2>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Home city for weather</span>
          <input
            value={homeCity}
            onChange={(event) => setHomeCity(event.target.value)}
            maxLength={80}
            placeholder="For example: London"
            className="h-11 rounded-xl border border-line bg-transparent px-3 text-base outline-none placeholder:text-muted focus:border-doom md:text-[15px]"
          />
        </label>
        <p className="text-sm text-muted">Your 07:00 briefing, routines and calendar day use this time zone.</p>
        <select
          value={timeZone}
          onChange={(event) => setTimeZone(event.target.value)}
          aria-label="Time zone"
          className="h-11 rounded-xl border border-line bg-panel px-3 text-base outline-none focus:border-doom md:text-[15px]"
        >
          {(timeZones.includes(timeZone) ? timeZones : [timeZone, ...timeZones]).map((zone) => (
            <option key={zone} value={zone}>
              {zone.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-line bg-panel p-5">
        <h2 className="font-display text-lg font-semibold">Morning briefing news</h2>
        <p className="text-sm text-muted">Pick up to {maxTopics} topics. Your briefing will include headlines for them.</p>
        <BriefingTopicsPicker selected={topics} onChange={setTopics} />
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => void saveSettings()}
            className="h-10 rounded-xl bg-doom px-4 text-sm font-semibold text-canvas"
          >
            Save settings
          </button>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-line bg-panel p-5">
        <h2 className="font-display text-lg font-semibold">Custom instructions</h2>
        <p className="text-sm text-muted">Tell DOOMBOT how to answer you, such as tone, language or what to focus on.</p>
        <textarea
          value={instructions}
          maxLength={data?.maxInstructionsLength ?? 1500}
          onChange={(event) => setInstructions(event.target.value)}
          rows={5}
          aria-label="Custom instructions"
          placeholder="For example: Keep answers short. Reply in English. I work in visa services."
          className="rounded-xl border border-line bg-transparent px-3 py-2 text-base leading-relaxed outline-none placeholder:text-muted focus:border-doom md:text-[15px]"
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-muted">
            {instructions.length} / {data?.maxInstructionsLength ?? 1500}
          </span>
          <button
            type="button"
            onClick={() => void saveSettings()}
            className="h-10 rounded-xl bg-doom px-4 text-sm font-semibold text-canvas"
          >
            Save settings
          </button>
        </div>
        {message && <p role="status" className="text-sm text-muted">{message}</p>}
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-line bg-panel p-5">
        <h2 className="font-display text-lg font-semibold">What DOOMBOT remembers about you</h2>
        <p className="text-sm text-muted">Facts saved with &quot;remember this&quot; in chat. Delete any you no longer want.</p>
        {data && data.memories.length === 0 && <p className="text-sm text-muted">Nothing saved yet.</p>}
        <ul className="flex flex-col gap-2">
          {data?.memories.map((memory) => (
            <li key={memory.id} className="flex items-start justify-between gap-3 rounded-xl border border-line px-3 py-2">
              <span className="text-sm leading-relaxed">{memory.fact}</span>
              <button
                type="button"
                onClick={() => void forget(memory.id)}
                className="shrink-0 rounded-lg px-2 py-1 text-xs text-muted hover:bg-raised hover:text-danger"
              >
                Forget
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-line bg-panel p-5">
        <h2 className="font-display text-lg font-semibold">Install as a shortcut</h2>
        <p className="text-sm text-muted">
          {installed ? "DOOMBOT is installed on this device." : "Add DOOMBOT to your home screen or desktop so it opens like an app."}
        </p>
        {!installed && (
          <button
            type="button"
            onClick={() => void installApp()}
            className="flex h-10 w-fit items-center gap-2 rounded-xl border border-line px-4 text-sm font-medium hover:bg-raised"
          >
            <Icon name="install_mobile" size={18} />
            Install app
          </button>
        )}
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-line bg-panel p-5">
        <h2 className="font-display text-lg font-semibold">About and legal</h2>
        <p className="text-sm text-muted">How DOOMBOT handles your data, and the rules for using it.</p>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/privacy" className="font-medium text-doom underline underline-offset-2">
            Privacy
          </Link>
          <Link href="/terms" className="font-medium text-doom underline underline-offset-2">
            Terms
          </Link>
        </div>
      </section>

      <section id="delete-data" className="flex scroll-mt-4 flex-col gap-3 rounded-2xl border border-danger/40 bg-panel p-5">
        <h2 className="font-display text-lg font-semibold">Delete my data</h2>
        <p className="text-sm text-muted">
          This permanently erases your chats, Doombots, memories, notes, to-dos, alerts and settings, and signs you out. It cannot be undone.
        </p>
        {!confirmingDelete ? (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="h-10 w-fit rounded-xl border border-danger/60 px-4 text-sm font-semibold text-danger hover:bg-raised"
          >
            Delete my data
          </button>
        ) : (
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted">Type DELETE to confirm</span>
              <input
                value={deleteText}
                onChange={(event) => setDeleteText(event.target.value)}
                autoComplete="off"
                className="h-11 rounded-xl border border-line bg-transparent px-3 text-base outline-none focus:border-danger md:text-[15px]"
              />
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={deleteText !== "DELETE"}
                onClick={() => void deleteEverything()}
                className="h-10 rounded-xl bg-danger px-4 text-sm font-semibold text-canvas disabled:opacity-40"
              >
                Delete everything
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmingDelete(false);
                  setDeleteText("");
                }}
                className="h-10 rounded-xl px-4 text-sm text-muted hover:bg-raised"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
