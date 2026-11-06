"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { DoomMark } from "@/components/doom-mark";
import { Markdown } from "@/components/markdown";

interface SharedChat {
  title: string;
  messages: { role: "user" | "assistant"; content: string }[];
}

export function SharedChatView({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [chat, setChat] = useState<SharedChat | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    fetch(`/api/share/${encodeURIComponent(token)}`)
      .then(async (response) => {
        if (!response.ok) {
          setMissing(true);
          return;
        }
        setChat((await response.json()) as SharedChat);
      })
      .catch(() => setMissing(true));
  }, [token]);

  return (
    <article className="flex w-full max-w-3xl flex-col gap-5 self-start">
      <header className="flex items-center gap-3">
        <DoomMark size={32} />
        <div className="flex min-w-0 flex-col">
          <h1 className="truncate font-display text-lg font-semibold">{chat?.title ?? "Shared chat"}</h1>
          <p className="text-xs text-muted">A read-only chat shared from DOOMBOT</p>
        </div>
      </header>

      {missing && (
        <p className="rounded-2xl border border-line bg-panel p-6 text-sm text-muted">
          This shared chat is not available. The owner may have stopped sharing it.
        </p>
      )}

      {chat?.messages.map((message, index) =>
        message.role === "user" ? (
          <div key={index} className="flex justify-end">
            <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-raised px-4 py-2.5 leading-relaxed">
              {message.content}
            </p>
          </div>
        ) : (
          <div key={index} className="flex gap-3">
            <DoomMark size={28} />
            <div className="min-w-0 flex-1 pt-0.5">
              <Markdown text={message.content} />
            </div>
          </div>
        ),
      )}

      <Link href="/login" className="w-fit text-sm text-doom underline underline-offset-2">
        Try DOOMBOT yourself
      </Link>
    </article>
  );
}
