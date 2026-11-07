"use client";

import { useState, type FormEvent } from "react";
import { Icon } from "@/components/icon";
import { jsonHeaders, withIdleActivity, type Bot } from "@/lib/bots/client";

interface DesignFormProps {
  onDesigned: (bots: Bot[]) => void;
  onError: (message: string | null) => void;
}

export function DesignForm({ onDesigned, onError }: DesignFormProps) {
  const [preferences, setPreferences] = useState("");
  const [designing, setDesigning] = useState(false);

  async function design(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDesigning(true);
    onError(null);
    try {
      const response = await fetch("/api/bots/design", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({ preferences }),
      });
      const data = (await response.json()) as {
        bots?: Bot[];
        skipped?: string[];
        error?: string;
      };
      if (!response.ok || !data.bots || data.bots.length === 0) {
        onError(
          data.error ??
            data.skipped?.join(" ") ??
            "No Doombots could be designed.",
        );
        return;
      }
      onDesigned(data.bots.map(withIdleActivity));
    } catch {
      onError(
        "DOOMBOT could not be reached. Check your connection and try again.",
      );
    } finally {
      setDesigning(false);
    }
  }

  return (
    <form
      onSubmit={design}
      className="flex flex-col gap-4 rounded-2xl border border-doom/40 bg-panel p-6"
    >
      <div className="flex items-center gap-2.5">
        <Icon name="auto_awesome" className="text-[22px] text-doom" />
        <h2 className="font-display text-lg font-semibold">
          Design Doombots for me
        </h2>
      </div>
      <label htmlFor="preferences" className="text-sm text-muted">
        Describe what you want help with, and when. DOOMBOT picks the jobs,
        tools and daily routines.
      </label>
      <textarea
        id="preferences"
        value={preferences}
        onChange={(event) => setPreferences(event.target.value)}
        rows={4}
        maxLength={2000}
        placeholder="Every morning at 7:30 tell me the weather and my calendar. Keep an eye on my unread email and tell me what is urgent."
        className="rounded-xl border border-line bg-canvas px-4 py-3 outline-none focus:border-doom"
      />
      <button
        type="submit"
        disabled={designing || preferences.trim().length < 10}
        className="h-10 w-fit rounded-xl bg-doom px-4 text-sm font-semibold text-canvas disabled:opacity-40"
      >
        {designing ? "Designing Doombots" : "Design and create"}
      </button>
    </form>
  );
}
