import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { ChatView } from "@/app/_components/chat-view";
import { ChatHeaderActions } from "@/app/_components/chat/chat-header";

export const metadata: Metadata = {
  title: "Chat",
  description: "Talk to DOOMBOT about your day, inbox, tasks and weather",
};

export default function ChatPage() {
  return (
    <AppShell title="DOOMBOT" actions={<ChatHeaderActions />} mobileActions={<ChatHeaderActions withNewChat />}>
      <ChatView />
    </AppShell>
  );
}
