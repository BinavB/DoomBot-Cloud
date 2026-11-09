"use client";

import { briefingTopics, maxTopics, type TopicId } from "@/lib/briefing/topics";

interface BriefingTopicsPickerProps {
  selected: TopicId[];
  onChange: (topics: TopicId[]) => void;
}

export function BriefingTopicsPicker({ selected, onChange }: BriefingTopicsPickerProps) {
  function toggle(id: TopicId) {
    onChange(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id]);
  }

  return (
    <fieldset className="grid gap-2 sm:grid-cols-2">
      <legend className="sr-only">News for your morning briefing</legend>
      {briefingTopics.map((topic) => {
        const checked = selected.includes(topic.id);
        const locked = !checked && selected.length >= maxTopics;
        return (
          <label
            key={topic.id}
            className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors ${
              checked ? "border-doom bg-doom-soft" : "border-line hover:bg-raised"
            } ${locked ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`}
          >
            <input
              type="checkbox"
              checked={checked}
              disabled={locked}
              onChange={() => toggle(topic.id)}
              className="h-4 w-4 shrink-0 accent-[var(--doom)]"
            />
            {topic.label}
          </label>
        );
      })}
    </fieldset>
  );
}

export async function saveBriefingTopics(topics: TopicId[]): Promise<boolean> {
  const response = await fetch("/api/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ briefingTopics: topics }),
  }).catch(() => null);
  return response?.ok ?? false;
}
