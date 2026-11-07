"use client";

import { useState } from "react";
import { jsonHeaders, type Bot, type BotTask } from "@/lib/bots/client";
import { AssignForm } from "./assign-form";
import { BotList } from "./bot-list";
import { BotProfile } from "./bot-profile";
import { CreateForm } from "./create-form";
import { DesignForm } from "./design-form";
import { MemoryList } from "./memory-list";
import { RoutineForm } from "./routine-form";
import { TaskList } from "./task-list";
import { useBotsData } from "./use-bots-data";

export function BotsView() {
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const {
    bots,
    tools,
    selectedId,
    tasks,
    memories,
    setBots,
    setSelectedId,
    setTasks,
    setMemories,
    replaceBot,
  } = useBotsData(setError);
  const selected = bots.find((bot) => bot.id === selectedId) ?? null;

  function select(bot: Bot) {
    setCreating(false);
    setError(null);
    setNotice(null);
    setTasks([]);
    setMemories([]);
    setSelectedId(bot.id);
  }

  function startCreating() {
    setCreating(true);
    setError(null);
    setNotice(null);
  }

  function addTask(task: BotTask) {
    setTasks((current) => [task, ...current]);
  }

  function handleDesigned(designed: Bot[]) {
    setBots((current) => [...current, ...designed]);
    select(designed[0]);
    setNotice(`Created ${designed.map((bot) => bot.name).join(", ")}.`);
  }

  function handleCreated(bot: Bot) {
    setBots((current) => [...current, bot]);
    select(bot);
  }

  async function remove(bot: Bot) {
    const response = await fetch(`/api/bots/${bot.id}`, { method: "DELETE" });
    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "The Doombot could not be deleted.");
      return;
    }
    const remaining = bots.filter((item) => item.id !== bot.id);
    setBots(remaining);
    setSelectedId(remaining[0]?.id ?? null);
    setTasks([]);
    setMemories([]);
  }

  async function forget(memoryId: number) {
    if (selectedId === null) {
      return;
    }
    await fetch(`/api/bots/${selectedId}/memory`, {
      method: "DELETE",
      headers: jsonHeaders,
      body: JSON.stringify({ memoryId }),
    });
    setMemories((current) =>
      current.filter((memory) => memory.id !== memoryId),
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 md:px-8 lg:grid-cols-[260px_1fr]">
      <BotList
        bots={bots}
        selectedId={selectedId}
        creating={creating}
        onSelect={select}
        onNew={startCreating}
      />

      <div className="flex min-w-0 flex-col gap-6">
        {error && (
          <p
            role="alert"
            className="rounded-xl border border-danger/40 px-4 py-3 text-sm text-danger"
          >
            {error}
          </p>
        )}

        {notice && (
          <p
            role="status"
            className="rounded-xl border border-doom/50 px-4 py-3 text-sm"
          >
            {notice}
          </p>
        )}

        {creating && (
          <DesignForm onDesigned={handleDesigned} onError={setError} />
        )}

        {creating && (
          <CreateForm
            tools={tools}
            nextLookIndex={bots.length + 1}
            onCreated={handleCreated}
            onCancel={() => setCreating(false)}
            onError={setError}
          />
        )}

        {!creating && selected && (
          <>
            <BotProfile
              key={selected.id}
              bot={selected}
              onChange={replaceBot}
              onDelete={(bot) => void remove(bot)}
              onError={setError}
            />
            <AssignForm
              key={`assign-${selected.id}`}
              botId={selected.id}
              botName={selected.name}
              onAssigned={addTask}
              onError={setError}
            />
            <RoutineForm
              key={`routine-${selected.id}`}
              bot={selected}
              onChange={replaceBot}
              onRunStarted={addTask}
              onNotice={setNotice}
              onError={setError}
            />
            <TaskList tasks={tasks} />
            <MemoryList
              botName={selected.name}
              memories={memories}
              onForget={(memoryId) => void forget(memoryId)}
            />
          </>
        )}
      </div>
    </div>
  );
}
