"use client";

import type { MenuItem } from "@/components/menu";
import { deleteChat, renameChat, shareChat } from "@/components/chat-store";

export function chatMenuItems(id: string, title: string): MenuItem[] {
  return [
    {
      label: "Rename",
      icon: "edit",
      onSelect: () => {
        const next = window.prompt("Rename chat", title)?.trim();
        if (next) {
          void renameChat(id, next);
        }
      },
    },
    { label: "Share link", hint: "Anyone with the link can read it for 30 days", icon: "share", onSelect: () => void shareChat(id) },
    {
      label: "Delete",
      icon: "delete",
      danger: true,
      onSelect: () => {
        if (window.confirm("Delete this chat and its messages?")) {
          void deleteChat(id);
        }
      },
    },
  ];
}
