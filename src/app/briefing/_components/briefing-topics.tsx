"use client";

import { useState } from "react";
import { BriefingTopicsPicker, saveBriefingTopics } from "@/components/briefing-topics-picker";
import { Icon } from "@/components/icon";
import { findTopic, maxTopics, type TopicId } from "@/lib/briefing/topics";

interface BriefingTopicsProps {
  topics: TopicId[];
  busy: boolean;
  onSaved: (topics: TopicId[], refresh: boolean) => void;
}

function describeTopics(topics: TopicId[]): string {
  return topics.length === 0 ? "No news topics" : topics.map((id) => findTopic(id).label).join(", ");
}

export function BriefingTopics({ topics, busy, onSaved }: BriefingTopicsProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<TopicId[]>(topics);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEditing() {
    setDraft(topics);
    setError(null);
    setEditing(true);
  }

  async function save(refresh: boolean) {
    setSaving(true);
    setError(null);
    const saved = await saveBriefingTopics(draft);
    setSaving(false);
    if (!saved) {
      setError("Your news topics could not be saved. Try again.");
      return;
    }
    setEditing(false);
    onSaved(draft, refresh);
  }

  if (!editing) {
    return (
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-panel px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <Icon name="newspaper" size={20} className="text-doom" />
          <div className="min-w-0">
            <p className="text-sm font-medium">News in your briefing</p>
            <p className="truncate text-sm text-muted">{describeTopics(topics)}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={startEditing}
          className="flex h-9 items-center gap-1.5 rounded-xl border border-line px-3 text-sm font-medium hover:bg-raised"
        >
          <Icon name="edit" size={16} />
          Edit topics
        </button>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-doom/50 bg-panel p-5">
      <div>
        <h2 className="font-display text-base font-semibold">What should your briefing cover?</h2>
        <p className="text-sm text-muted">Pick up to {maxTopics}. Untick them all if you do not want news.</p>
      </div>
      <BriefingTopicsPicker selected={draft} onChange={setDraft} />
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={saving || busy}
          onClick={() => void save(true)}
          className="h-10 rounded-xl bg-doom px-4 text-sm font-semibold text-canvas disabled:opacity-50"
        >
          Save and update briefing
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => void save(false)}
          className="h-10 rounded-xl border border-line px-4 text-sm font-medium hover:bg-raised disabled:opacity-50"
        >
          Save for tomorrow
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="h-10 rounded-xl px-3 text-sm text-muted hover:bg-raised hover:text-ink"
        >
          Cancel
        </button>
      </div>
    </section>
  );
}
