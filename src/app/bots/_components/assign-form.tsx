"use client";

import { useState, type FormEvent } from "react";
import { jsonHeaders, type BotTask } from "@/lib/bots/client";

interface AssignFormProps {
  botId: number;
  botName: string;
  onAssigned: (task: BotTask) => void;
  onError: (message: string | null) => void;
}

export function AssignForm({
  botId,
  botName,
  onAssigned,
  onError,
}: AssignFormProps) {
  const [instruction, setInstruction] = useState("");

  async function assign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onError(null);
    const response = await fetch(`/api/bots/${botId}/tasks`, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({ instruction }),
    });
    const data = (await response.json()) as { task?: BotTask; error?: string };
    if (!response.ok || !data.task) {
      onError(data.error ?? "The task could not be assigned.");
      return;
    }
    onAssigned(data.task);
    setInstruction("");
  }

  return (
    <form
      onSubmit={assign}
      className="flex flex-col gap-3 rounded-2xl border border-line bg-panel p-6"
    >
      <label htmlFor="assign" className="font-display text-base font-semibold">
        Assign a task
      </label>
      <textarea
        id="assign"
        value={instruction}
        onChange={(event) => setInstruction(event.target.value)}
        rows={3}
        maxLength={2000}
        placeholder={`Tell ${botName} what to do`}
        className="rounded-xl border border-line bg-canvas px-4 py-3 outline-none focus:border-doom"
      />
      <button
        type="submit"
        disabled={instruction.trim().length === 0}
        className="h-10 w-fit rounded-xl bg-doom px-4 text-sm font-semibold text-canvas disabled:opacity-40"
      >
        Assign task
      </button>
    </form>
  );
}
