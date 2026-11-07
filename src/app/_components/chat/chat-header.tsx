"use client";

import { useEffect, useState } from "react";
import { chatMenuItems } from "@/components/chat-menu-items";
import { setMode, useChatState } from "@/components/chat-store";
import { Icon } from "@/components/icon";
import { Menu, type MenuItem } from "@/components/menu";

interface ModelInfo {
  name: string;
  backups: string[];
}

const iconButton = "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-raised hover:text-ink";

export function ModelMenu({ compact = false }: { compact?: boolean }) {
  const { mode } = useChatState();
  const [info, setInfo] = useState<ModelInfo | null>(null);

  useEffect(() => {
    fetch("/api/model")
      .then((response) => response.json() as Promise<ModelInfo>)
      .then(setInfo)
      .catch(() => setInfo({ name: "DOOMBOT", backups: [] }));
  }, []);

  const think = mode === "think";
  const modelName = info?.name ?? "DOOMBOT";
  const backupText = info && info.backups.length > 0 ? `Backups if the main model is busy: ${info.backups.join(", ")}.` : "";
  const items: MenuItem[] = [
    { label: "Fast", hint: "Quick answers for everyday questions", icon: "bolt", selected: !think, onSelect: () => setMode("fast") },
    { label: "Think", hint: "Deeper reasoning, a little slower", icon: "psychology", selected: think, onSelect: () => setMode("think") },
  ];

  return (
    <Menu
      label="Model and mode"
      width="w-72"
      items={items}
      header={
        <p className="px-3 pt-2 pb-2 text-xs leading-relaxed text-muted">
          Model: {modelName}. {backupText}
        </p>
      }
      triggerClassName="flex max-w-[12rem] items-center gap-1.5 rounded-lg px-2 py-1 text-sm hover:bg-raised"
      trigger={
        <>
          <span className="truncate font-medium">{compact ? (think ? "Think" : "Fast") : `${modelName} · ${think ? "Think" : "Fast"}`}</span>
          <Icon name="unfold_more" size={16} className="shrink-0 text-muted" />
        </>
      }
    />
  );
}

export function ChatActionsMenu() {
  const { conversations, selectedId } = useChatState();
  const chat = conversations.find((item) => item.id === selectedId);
  if (!chat) {
    return null;
  }
  return (
    <Menu
      label="Chat actions"
      width="w-60"
      items={chatMenuItems(chat.id, chat.title)}
      trigger={<Icon name="more_horiz" size={20} />}
      triggerClassName={iconButton}
    />
  );
}

export function ChatHeaderActions({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-1">
      <ModelMenu compact={compact} />
      <ChatActionsMenu />
    </div>
  );
}
