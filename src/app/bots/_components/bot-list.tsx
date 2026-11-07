"use client";

import { BotAvatar } from "@/components/bot-avatar";
import { Icon } from "@/components/icon";
import { activityLabel, type Bot } from "@/lib/bots/client";

interface BotListProps {
  bots: Bot[];
  selectedId: number | null;
  creating: boolean;
  onSelect: (bot: Bot) => void;
  onNew: () => void;
}

export function BotList({
  bots,
  selectedId,
  creating,
  onSelect,
  onNew,
}: BotListProps) {
  return (
    <aside className="flex flex-col gap-2">
      <ul className="flex flex-col gap-1">
        {bots.map((bot) => {
          const active = !creating && bot.id === selectedId;
          const activity = activityLabel(bot.activity);
          return (
            <li key={bot.id}>
              <button
                type="button"
                onClick={() => onSelect(bot)}
                aria-current={active ? "true" : undefined}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                  active
                    ? "bg-raised font-medium ring-1 ring-line"
                    : "text-muted hover:bg-raised hover:text-ink"
                }`}
              >
                <BotAvatar look={bot.look} size={32} />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate">{bot.name}</span>
                  <span className={`truncate text-xs ${activity.style}`}>
                    {activity.text}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        data-tour="bots-new"
        onClick={onNew}
        className="mt-2 flex items-center justify-center gap-2 rounded-xl border border-dashed border-line px-3 py-2.5 text-sm font-medium hover:border-doom hover:text-doom"
      >
        <Icon name="add" className="text-[20px]" />
        New Doombot
      </button>
    </aside>
  );
}
