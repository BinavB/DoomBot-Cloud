"use client";

import { useState, type FormEvent } from "react";
import { Icon } from "@/components/icon";
import {
  describeSchedule,
  frequencies,
  frequencyLabels,
  weekdayNames,
  type Frequency,
} from "@/lib/bots/frequency";
import {
  jsonHeaders,
  monthDates,
  nextRoutineDay,
  type Bot,
  type BotTask,
} from "@/lib/bots/client";

interface RoutineFormProps {
  bot: Bot;
  onChange: (bot: Bot) => void;
  onRunStarted: (task: BotTask) => void;
  onNotice: (message: string) => void;
  onError: (message: string | null) => void;
}

const fieldClass =
  "h-11 rounded-xl border border-line bg-canvas px-3 outline-none focus:border-doom";

export function RoutineForm({
  bot,
  onChange,
  onRunStarted,
  onNotice,
  onError,
}: RoutineFormProps) {
  const [time, setTime] = useState(bot.routine?.time ?? "");
  const [instruction, setInstruction] = useState(
    bot.routine?.instruction ?? "",
  );
  const [frequency, setFrequency] = useState<Frequency>(
    bot.routine?.frequency ?? "daily",
  );
  const [day, setDay] = useState<number | null>(bot.routine?.day ?? null);

  async function saveRoutine(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onError(null);
    const response = await fetch(`/api/bots/${bot.id}/routine`, {
      method: "PUT",
      headers: jsonHeaders,
      body: JSON.stringify({
        time,
        instruction,
        frequency,
        day,
        enabled: true,
      }),
    });
    const data = (await response.json()) as { bot?: Bot; error?: string };
    if (!response.ok || !data.bot) {
      onError(data.error ?? "The routine could not be saved.");
      return;
    }
    onChange(data.bot);
    onNotice(
      data.bot.routine
        ? `Routine saved. It runs ${describeSchedule(data.bot.routine)} while DOOMBOT is running.`
        : "Routine saved.",
    );
  }

  async function setEnabled(enabled: boolean) {
    if (!bot.routine) {
      return;
    }
    const response = await fetch(`/api/bots/${bot.id}/routine`, {
      method: "PUT",
      headers: jsonHeaders,
      body: JSON.stringify({
        time: bot.routine.time,
        instruction: bot.routine.instruction,
        frequency: bot.routine.frequency,
        day: bot.routine.day,
        enabled,
      }),
    });
    const data = (await response.json()) as { bot?: Bot; error?: string };
    if (data.bot) {
      onChange(data.bot);
    } else {
      onError(data.error ?? "The routine could not be changed.");
    }
  }

  async function removeRoutine() {
    const response = await fetch(`/api/bots/${bot.id}/routine`, {
      method: "DELETE",
    });
    const data = (await response.json()) as { bot?: Bot };
    if (data.bot) {
      onChange(data.bot);
      setTime("");
      setInstruction("");
      setFrequency("daily");
      setDay(null);
    }
  }

  async function runNow() {
    onError(null);
    const response = await fetch(`/api/bots/${bot.id}/routine/run`, {
      method: "POST",
    });
    const data = (await response.json()) as { task?: BotTask; error?: string };
    if (!response.ok || !data.task) {
      onError(data.error ?? "The routine could not be started.");
      return;
    }
    onRunStarted(data.task);
    onNotice(
      "Routine started. The result appears in Alerts and in the task list.",
    );
  }

  return (
    <form
      onSubmit={saveRoutine}
      className="flex flex-col gap-4 rounded-2xl border border-line bg-panel p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Icon name="schedule" className="text-[22px] text-doom" />
          <h3 className="font-display text-base font-semibold">Routine</h3>
        </div>
        {bot.routine && (
          <span
            className={`text-sm ${bot.routine.enabled ? "text-doom" : "text-muted"}`}
          >
            {bot.routine.enabled
              ? `Runs ${describeSchedule(bot.routine)}`
              : "Paused"}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="flex flex-col gap-2 text-sm">
          How often
          <select
            value={frequency}
            onChange={(event) => {
              const next = event.target.value as Frequency;
              setFrequency(next);
              setDay(nextRoutineDay(next));
            }}
            className={fieldClass}
          >
            {frequencies.map((option) => (
              <option key={option} value={option}>
                {frequencyLabels[option]}
              </option>
            ))}
          </select>
        </label>
        {frequency === "weekly" && (
          <label className="flex flex-col gap-2 text-sm">
            Day
            <select
              value={day ?? 1}
              onChange={(event) => setDay(Number(event.target.value))}
              className={fieldClass}
            >
              {weekdayNames.map((name, index) => (
                <option key={name} value={index}>
                  {name}
                </option>
              ))}
            </select>
          </label>
        )}
        {frequency === "monthly" && (
          <label className="flex flex-col gap-2 text-sm">
            Date
            <select
              value={day ?? 1}
              onChange={(event) => setDay(Number(event.target.value))}
              className={fieldClass}
            >
              {monthDates().map((date) => (
                <option key={date} value={date}>
                  {date}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="flex flex-col gap-2 text-sm">
          Time (your time zone)
          <input
            type="time"
            value={time}
            onChange={(event) => setTime(event.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="flex flex-1 flex-col gap-2 text-sm">
          What to do
          <input
            value={instruction}
            onChange={(event) => setInstruction(event.target.value)}
            maxLength={1000}
            placeholder="Check my calendar and list today's events"
            className="h-11 rounded-xl border border-line bg-canvas px-4 outline-none focus:border-doom"
          />
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={time.length === 0 || instruction.trim().length === 0}
          className="h-10 rounded-xl bg-doom px-4 text-sm font-semibold text-canvas disabled:opacity-40"
        >
          Save routine
        </button>
        {bot.routine && (
          <>
            <button
              type="button"
              onClick={() => void runNow()}
              className="h-10 rounded-xl border border-line px-4 text-sm font-medium hover:bg-raised"
            >
              Run now
            </button>
            <button
              type="button"
              onClick={() => void setEnabled(!bot.routine?.enabled)}
              className="h-10 rounded-xl border border-line px-4 text-sm font-medium hover:bg-raised"
            >
              {bot.routine.enabled ? "Pause routine" : "Resume routine"}
            </button>
            <button
              type="button"
              onClick={() => void removeRoutine()}
              className="h-10 rounded-xl px-4 text-sm text-muted hover:bg-raised hover:text-danger"
            >
              Remove routine
            </button>
          </>
        )}
      </div>
    </form>
  );
}
