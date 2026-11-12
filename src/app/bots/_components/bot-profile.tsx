"use client";

import { useEffect, useState, type FormEvent } from "react";
import { BotAvatar } from "@/components/bot-avatar";
import { Icon } from "@/components/icon";
import type { BotLook } from "@/lib/bots/look";
import { toolLabel } from "@/lib/bots/tool-labels";
import { LookPicker } from "./look-picker";

export interface ProfileBot {
  id: number;
  name: string;
  instructions: string;
  toolNames: string[];
  provider?: string | null;
  builtIn: boolean;
  look: BotLook;
}

interface ProviderOption {
  name: string;
  label: string;
}

interface BotProfileProps<Bot extends ProfileBot> {
  bot: Bot;
  onChange: (bot: Bot) => void;
  onDelete: (bot: Bot) => void;
  onError: (message: string) => void;
}

export function BotProfile<Bot extends ProfileBot>({ bot, onChange, onDelete, onError }: BotProfileProps<Bot>) {
  const [renaming, setRenaming] = useState(false);
  const [draftName, setDraftName] = useState(bot.name);
  const [customizing, setCustomizing] = useState(false);
  const [providers, setProviders] = useState<ProviderOption[]>([]);

  useEffect(() => {
    fetch("/api/model-providers")
      .then((response) => response.json() as Promise<{ providers: ProviderOption[] }>)
      .then((data) => setProviders(data.providers))
      .catch(() => setProviders([]));
  }, []);

  async function save(change: Record<string, string>): Promise<boolean> {
    const response = await fetch(`/api/bots/${bot.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(change),
    });
    const data = (await response.json()) as { bot?: Bot; error?: string };
    if (!response.ok || !data.bot) {
      onError(data.error ?? "The change could not be saved.");
      return false;
    }
    onChange(data.bot);
    return true;
  }

  async function rename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (await save({ name: draftName })) {
      setRenaming(false);
    }
  }

  function startRename() {
    setDraftName(bot.name);
    setRenaming(true);
  }

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-line bg-panel p-6">
      <div className="flex flex-wrap items-center gap-4">
        <BotAvatar look={bot.look} size={72} />
        <div className="flex min-w-48 flex-1 flex-col gap-1">
          {renaming ? (
            <form onSubmit={rename} className="flex flex-wrap items-center gap-2">
              <input
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                maxLength={40}
                aria-label="Doombot name"
                autoFocus
                className="h-10 w-full rounded-xl border border-line bg-canvas px-3 font-display text-lg font-semibold outline-none focus:border-doom"
              />
              <button
                type="submit"
                disabled={draftName.trim().length < 2}
                className="h-10 rounded-xl bg-doom px-4 text-sm font-semibold text-canvas disabled:opacity-40"
              >
                Save name
              </button>
              <button
                type="button"
                onClick={() => setRenaming(false)}
                className="h-10 rounded-xl border border-line px-4 text-sm font-medium hover:bg-raised"
              >
                Cancel
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="font-display text-xl font-semibold break-words">{bot.name}</h2>
              <button
                type="button"
                onClick={startRename}
                aria-label={`Rename ${bot.name}`}
                title="Rename"
                className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-raised hover:text-ink"
              >
                <Icon name="edit" size={18} />
              </button>
            </div>
          )}
          <p className="text-xs text-muted">{bot.builtIn ? "Default Doombot" : "Substitute Doombot"}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setCustomizing((open) => !open)}
            aria-expanded={customizing}
            className="flex h-10 items-center gap-2 rounded-xl border border-line px-4 text-sm font-medium hover:bg-raised"
          >
            <Icon name="palette" size={18} />
            Customize look
          </button>
          {!bot.builtIn && (
            <button
              type="button"
              onClick={() => onDelete(bot)}
              className="h-10 rounded-xl px-3 text-sm text-muted hover:bg-raised hover:text-danger"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {customizing && (
        <div className="rounded-2xl bg-canvas p-5">
          <LookPicker look={bot.look} onChange={(change) => void save(change)} />
        </div>
      )}

      <p className="leading-relaxed text-muted">{bot.instructions}</p>
      {providers.length > 0 && (
        <div className="flex flex-col gap-1">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">Model</span>
            <select
              value={bot.provider ?? ""}
              onChange={(event) => void save({ provider: event.target.value })}
              className="h-11 rounded-xl border border-line bg-panel px-3 text-base outline-none focus:border-doom md:text-[15px]"
            >
              <option value="">Automatic</option>
              {providers.map((provider) => (
                <option key={provider.name} value={provider.name}>
                  {provider.label}
                </option>
              ))}
            </select>
          </label>
          <span className="text-xs text-muted">
            This Doombot tries that provider first. If it is unavailable, DOOMBOT tries the others.
          </span>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {bot.toolNames.length === 0 ? (
          <span className="text-xs text-muted">No tools. It can only think and use its memory.</span>
        ) : (
          bot.toolNames.map((name) => (
            <span key={name} className="rounded-full bg-raised px-3 py-1 text-xs">
              {toolLabel(name)}
            </span>
          ))
        )}
      </div>
    </section>
  );
}
