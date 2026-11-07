"use client";

import { useCallback, useEffect, useState } from "react";
import type { Bot, BotMemory, BotTask, ToolInfo } from "@/lib/bots/client";

const pollMilliseconds = 3000;

async function fetchBotDetail(
  botId: number,
): Promise<{ tasks: BotTask[]; memories: BotMemory[] }> {
  const [taskResponse, memoryResponse] = await Promise.all([
    fetch(`/api/bots/${botId}/tasks`),
    fetch(`/api/bots/${botId}/memory`),
  ]);
  const taskData = (await taskResponse.json()) as { tasks: BotTask[] };
  const memoryData = (await memoryResponse.json()) as { memories: BotMemory[] };
  return { tasks: taskData.tasks, memories: memoryData.memories };
}

export function useBotsData(onError: (message: string) => void) {
  const [bots, setBots] = useState<Bot[]>([]);
  const [tools, setTools] = useState<ToolInfo[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [tasks, setTasks] = useState<BotTask[]>([]);
  const [memories, setMemories] = useState<BotMemory[]>([]);
  const hasRunningTask = tasks.some((task) => task.status === "running");

  useEffect(() => {
    Promise.all([fetch("/api/bots"), fetch("/api/bot-tools")])
      .then(async ([botResponse, toolResponse]) => {
        const botData = (await botResponse.json()) as { bots: Bot[] };
        const toolData = (await toolResponse.json()) as { tools: ToolInfo[] };
        setBots(botData.bots);
        setTools(toolData.tools);
        setSelectedId((current) => current ?? botData.bots[0]?.id ?? null);
      })
      .catch(() =>
        onError(
          "Doombots could not load. Check that the server is running, then reload.",
        ),
      );
  }, [onError]);

  useEffect(() => {
    const timer = setInterval(() => {
      fetch("/api/bots")
        .then((response) => response.json() as Promise<{ bots: Bot[] }>)
        .then((data) => {
          setBots((current) =>
            current.map((bot) => ({
              ...bot,
              activity:
                data.bots.find((fresh) => fresh.id === bot.id)?.activity ??
                bot.activity,
            })),
          );
        })
        .catch(() => undefined);
    }, pollMilliseconds);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (selectedId === null) {
      return;
    }
    let cancelled = false;
    fetchBotDetail(selectedId)
      .then((detail) => {
        if (!cancelled) {
          setTasks(detail.tasks);
          setMemories(detail.memories);
        }
      })
      .catch(() =>
        onError(
          "This Doombot's history could not load. Reload the page to try again.",
        ),
      );
    return () => {
      cancelled = true;
    };
  }, [selectedId, onError]);

  useEffect(() => {
    if (selectedId === null || !hasRunningTask) {
      return;
    }
    const timer = setInterval(() => {
      fetchBotDetail(selectedId)
        .then((detail) => {
          setTasks(detail.tasks);
          setMemories(detail.memories);
        })
        .catch(() => undefined);
    }, pollMilliseconds);
    return () => clearInterval(timer);
  }, [selectedId, hasRunningTask]);

  const replaceBot = useCallback((updated: Bot) => {
    setBots((current) =>
      current.map((bot) =>
        bot.id === updated.id ? { ...updated, activity: bot.activity } : bot,
      ),
    );
  }, []);

  return {
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
  };
}
