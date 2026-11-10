"use client";

import { useState, type FormEvent } from "react";
import {
  jsonHeaders,
  toggleName,
  withIdleActivity,
  type Bot,
  type ToolInfo,
} from "@/lib/bots/client";
import { defaultLook, type BotLook } from "@/lib/bots/look";
import { assistantNames } from "@/lib/bots/names";
import { LookPicker } from "./look-picker";

interface CreateFormProps {
  tools: ToolInfo[];
  nextLookIndex: number;
  onCreated: (bot: Bot) => void;
  onCancel: () => void;
  onError: (message: string | null) => void;
}

export function CreateForm({
  tools,
  nextLookIndex,
  onCreated,
  onCancel,
  onError,
}: CreateFormProps) {
  const [name, setName] = useState("");
  const [instructions, setInstructions] = useState("");
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [look, setLook] = useState<BotLook>(() => defaultLook(nextLookIndex));

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onError(null);
    const response = await fetch("/api/bots", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({
        name,
        instructions,
        toolNames: selectedTools,
        ...look,
      }),
    });
    const data = (await response.json()) as { bot?: Bot; error?: string };
    if (!response.ok || !data.bot) {
      onError(data.error ?? "The Doombot could not be created.");
      return;
    }
    onCreated(withIdleActivity(data.bot));
  }

  return (
    <form
      onSubmit={create}
      className="flex flex-col gap-5 rounded-2xl border border-line bg-panel p-6"
    >
      <h2 className="font-display text-lg font-semibold">
        Or build one yourself
      </h2>
      <label className="flex flex-col gap-2 text-sm">
        Name
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={40}
          placeholder="Jarvis"
          className="h-11 rounded-xl border border-line bg-canvas px-4 outline-none focus:border-doom"
        />
      </label>
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted">Pick a name that fits the job:</p>
        <div className="flex flex-wrap gap-2">
          {assistantNames.map((item) => (
            <button
              key={item.name}
              type="button"
              title={item.strength}
              onClick={() => setName(item.name)}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                name === item.name ? "border-doom bg-doom-soft text-ink" : "border-line text-muted hover:bg-raised hover:text-ink"
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>
      <label className="flex flex-col gap-2 text-sm">
        What is its job?
        <textarea
          value={instructions}
          onChange={(event) => setInstructions(event.target.value)}
          maxLength={2000}
          rows={4}
          placeholder="You track my open tasks and tell me which one to do first, with a short reason."
          className="rounded-xl border border-line bg-canvas px-4 py-3 outline-none focus:border-doom"
        />
      </label>
      <div className="flex flex-col gap-3">
        <LookPicker
          look={look}
          onChange={(change) =>
            setLook((current) => ({ ...current, ...change }))
          }
        />
      </div>
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm">Tools it can use</legend>
        {tools.map((tool) => (
          <label key={tool.name} className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={selectedTools.includes(tool.name)}
              onChange={() =>
                setSelectedTools((current) => toggleName(current, tool.name))
              }
              className="mt-1 h-4 w-4 accent-[var(--doom)]"
            />
            <span>
              <span className="font-medium">{tool.name}</span>
              <span className="block text-muted">{tool.description}</span>
            </span>
          </label>
        ))}
        <p className="text-xs text-muted">
          Doombots cannot send email, change your calendar or spend. Actions like that always go
          through your approvals.
        </p>
      </fieldset>
      <div className="flex gap-2">
        <button
          type="submit"
          className="h-10 rounded-xl bg-doom px-4 text-sm font-semibold text-canvas"
        >
          Create Doombot
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="h-10 rounded-xl border border-line px-4 text-sm font-medium hover:bg-raised"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
