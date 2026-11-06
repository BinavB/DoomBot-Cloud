import type { Metadata } from "next";
import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { SharedChatView } from "@/app/share/[token]/_components/shared-chat-view";

export const metadata: Metadata = {
  title: "Shared chat",
  description: "A chat shared from DOOMBOT",
  robots: { index: false, follow: false },
};

export default function SharedChatPage({ params }: PageProps<"/share/[token]">) {
  return (
    <AppShell title="Shared chat" bare>
      <Suspense fallback={<p className="text-sm text-muted">Loading the shared chat</p>}>
        <SharedChatView params={params} />
      </Suspense>
    </AppShell>
  );
}
