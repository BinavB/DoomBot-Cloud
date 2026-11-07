"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ChatHistory } from "@/app/_components/chat-history";
import { VoiceInput } from "@/app/_components/voice-input";
import { canSpeak, speak, stopSpeaking } from "@/lib/speech";
import { announceApprovalsChanged } from "@/components/events";
import { DoomMark } from "@/components/doom-mark";
import { Icon } from "@/components/icon";
import { Markdown } from "@/components/markdown";
import { StatusPill } from "@/components/status-pill";
import { announceStatus, startStatus } from "@/components/status-store";
import type { Conversation } from "@/lib/conversations";

interface ChatLine {
  id: number;
  role: "user" | "assistant";
  content: string;
}

interface StreamEvent {
  type: "token" | "done" | "error";
  text?: string;
  reply?: string;
  approvalsCreated?: number[];
  error?: string;
}

const suggestions = [
  "Brief me on today",
  "What's on my calendar today?",
  "Summarize my unread email",
  "What's the weather in Dubai?",
];

const nearBottomPixels = 96;
const composerMaxHeight = 200;

async function readEvents(response: Response, onEvent: (event: StreamEvent) => void): Promise<void> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No response");
  }
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      return;
    }
    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() ?? "";
    for (const block of blocks) {
      const line = block.split("\n").find((item) => item.startsWith("data: "));
      if (line) {
        onEvent(JSON.parse(line.slice(6)) as StreamEvent);
      }
    }
  }
}

export function ChatView() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lines, setLines] = useState<ChatLine[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showApprovalNotice, setShowApprovalNotice] = useState(false);
  const [showJump, setShowJump] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [showChats, setShowChats] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [think, setThink] = useState(false);
  const [shareNotice, setShareNotice] = useState<{ id: string; url: string } | null>(null);
  const [pendingPdf, setPendingPdf] = useState<{ name: string; data: string } | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editDraft, setEditDraft] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const stickToBottom = useRef(true);
  const firstScroll = useRef(true);
  const nextLocalId = useRef(-1);
  const abortRef = useRef<AbortController | null>(null);

  const loadConversations = useCallback(async (): Promise<Conversation[]> => {
    const response = await fetch("/api/conversations");
    const data = (await response.json()) as { conversations: Conversation[] };
    setConversations(data.conversations);
    return data.conversations;
  }, []);

  const loadMessages = useCallback(async (id: string) => {
    setLoaded(false);
    try {
      const response = await fetch(`/api/chat?conversation=${encodeURIComponent(id)}`);
      const data = (await response.json()) as { messages?: ChatLine[]; error?: string };
      if (!response.ok || !data.messages) {
        setError(data.error ?? "Chat history could not load.");
        return;
      }
      setLines(data.messages);
    } catch {
      setError("Chat history could not load. Reload the page to try again.");
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetch("/api/conversations")
      .then((response) => response.json() as Promise<{ conversations: Conversation[] }>)
      .then((data) => {
        setConversations(data.conversations);
        const first = data.conversations[0]?.id ?? null;
        setSelectedId(first);
        if (!first) {
          setLoaded(true);
          return;
        }
        return fetch(`/api/chat?conversation=${encodeURIComponent(first)}`)
          .then((response) => response.json() as Promise<{ messages?: ChatLine[]; error?: string }>)
          .then((history) => {
            if (history.messages) {
              setLines(history.messages);
            } else {
              setError(history.error ?? "Chat history could not load.");
            }
          });
      })
      .catch(() => setError("Chats could not load. Reload the page to try again."))
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (!stickToBottom.current) {
      return;
    }
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    endRef.current?.scrollIntoView({
      behavior: firstScroll.current || reduceMotion ? "auto" : "smooth",
      block: "end",
    });
    if (lines.length > 0) {
      firstScroll.current = false;
    }
  }, [lines, sending]);

  function handleScroll() {
    const element = scrollRef.current;
    if (!element) {
      return;
    }
    const distance = element.scrollHeight - element.scrollTop - element.clientHeight;
    stickToBottom.current = distance < nearBottomPixels;
    setShowJump(!stickToBottom.current);
  }

  function jumpToLatest() {
    stickToBottom.current = true;
    setShowJump(false);
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }

  function resizeComposer() {
    const element = composerRef.current;
    if (!element) {
      return;
    }
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, composerMaxHeight)}px`;
  }

  function selectChat(id: string) {
    if (sending) {
      return;
    }
    setSelectedId(id);
    setError(null);
    setShowApprovalNotice(false);
    setShowChats(false);
    firstScroll.current = true;
    void loadMessages(id);
  }

  async function newChat() {
    if (sending) {
      return;
    }
    const response = await fetch("/api/conversations", { method: "POST" });
    const data = (await response.json()) as { conversation?: Conversation; error?: string };
    if (!response.ok || !data.conversation) {
      setError(data.error ?? "A new chat could not be started.");
      return;
    }
    setConversations((current) => [data.conversation as Conversation, ...current]);
    setSelectedId(data.conversation.id);
    setLines([]);
    setError(null);
    setShowChats(false);
    firstScroll.current = true;
  }

  async function renameChat(id: string, title: string) {
    const response = await fetch(`/api/conversations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (!response.ok) {
      setError("The chat could not be renamed.");
      return;
    }
    setConversations((current) => current.map((item) => (item.id === id ? { ...item, title } : item)));
  }

  async function shareChat(id: string) {
    const response = await fetch(`/api/conversations/${id}/share`, { method: "POST" });
    const data = (await response.json()) as { token?: string; error?: string };
    if (!response.ok || !data.token) {
      setError(data.error ?? "The chat could not be shared.");
      return;
    }
    const url = `${window.location.origin}/share/${data.token}`;
    setShareNotice({ id, url });
    setShowChats(false);
    await navigator.clipboard.writeText(url).catch(() => undefined);
  }

  async function stopSharing(id: string) {
    const response = await fetch(`/api/conversations/${id}/share`, { method: "DELETE" });
    if (response.ok) {
      setShareNotice(null);
    } else {
      setError("Sharing could not be stopped.");
    }
  }

  async function deleteChat(id: string) {
    if (sending || !window.confirm("Delete this chat and its messages?")) {
      return;
    }
    const response = await fetch(`/api/conversations/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setError("The chat could not be deleted.");
      return;
    }
    const remaining = conversations.filter((item) => item.id !== id);
    setConversations(remaining);
    if (selectedId === id) {
      const next = remaining[0]?.id ?? null;
      setSelectedId(next);
      setLines([]);
      if (next) {
        void loadMessages(next);
      }
    }
  }

  async function reloadHistory(id: string) {
    const response = await fetch(`/api/chat?conversation=${encodeURIComponent(id)}`);
    const data = (await response.json()) as { messages?: ChatLine[] };
    if (data.messages) {
      setLines(data.messages);
    }
  }

  async function rewindTo(messageId: number): Promise<boolean> {
    if (!selectedId) {
      return false;
    }
    const response = await fetch("/api/chat/rewind", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: selectedId, messageId }),
    });
    return response.ok;
  }

  async function regenerate(index: number) {
    if (sending || !selectedId) {
      return;
    }
    const userLine = lines.slice(0, index).reverse().find((line) => line.role === "user");
    if (!userLine || userLine.id <= 0) {
      setError("Reload the page before regenerating this reply.");
      return;
    }
    if (!(await rewindTo(userLine.id))) {
      setError("The reply could not be regenerated.");
      return;
    }
    await reloadHistory(selectedId);
    await send(userLine.content);
  }

  async function saveEdit(line: ChatLine) {
    const text = editDraft.trim();
    if (sending || !selectedId || text.length === 0) {
      return;
    }
    setEditingId(null);
    if (!(await rewindTo(line.id))) {
      setError("The message could not be edited.");
      return;
    }
    await reloadHistory(selectedId);
    await send(text);
  }

  async function ensureChat(): Promise<string | null> {
    if (selectedId) {
      return selectedId;
    }
    const response = await fetch("/api/conversations", { method: "POST" });
    const data = (await response.json()) as { conversation?: Conversation };
    if (!data.conversation) {
      setError("A new chat could not be started.");
      return null;
    }
    setConversations((current) => [data.conversation as Conversation, ...current]);
    setSelectedId(data.conversation.id);
    return data.conversation.id;
  }

  function attachImage(file: File | undefined) {
    if (!file) {
      return;
    }
    const isPdf = file.type === "application/pdf";
    const isImage = ["image/png", "image/jpeg", "image/webp"].includes(file.type);
    if ((!isPdf && !isImage) || file.size > (isPdf ? 4 : 2.5) * 1024 * 1024) {
      setImageError("Attach a PNG, JPEG or WebP image up to 2.5 MB, or a PDF up to 4 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      setImageError(null);
      if (isPdf) {
        setPendingImage(null);
        setPendingPdf(result ? { name: file.name, data: result } : null);
        announceStatus("PDF attached");
      } else {
        setPendingPdf(null);
        setPendingImage(result);
        announceStatus("Image attached");
      }
    };
    reader.readAsDataURL(file);
  }

  async function send(text: string) {
    const attached = pendingImage;
    const attachedPdf = pendingPdf;
    const typed = text.trim();
    const fallback = attachedPdf ? "Summarize this document." : attached ? "What is in this image?" : "";
    const message = typed.length > 0 ? typed : fallback;
    if (message.length === 0 || sending) {
      return;
    }
    setPendingImage(null);
    setPendingPdf(null);
    const chatId = await ensureChat();
    if (!chatId) {
      return;
    }

    stickToBottom.current = true;
    setShowJump(false);
    setSending(true);
    setError(null);
    setShowApprovalNotice(false);
    setDraft("");
    requestAnimationFrame(resizeComposer);

    const replyId = nextLocalId.current--;
    setLines((current) => [
      ...current,
      { id: nextLocalId.current--, role: "user", content: message },
      { id: replyId, role: "assistant", content: "" },
    ]);

    const controller = new AbortController();
    abortRef.current = controller;
    let finalReply: string | null = null;
    const status = startStatus("DOOMBOT is replying");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          conversationId: chatId,
          image: attached ?? undefined,
          pdf: attachedPdf?.data,
          pdfName: attachedPdf?.name,
          think,
        }),
        signal: controller.signal,
      });
      if (!response.ok || !response.body) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "DOOMBOT could not answer. Try again in a moment.");
      }
      await readEvents(response, (event) => {
        if (event.type === "token" && event.text) {
          const chunk = event.text;
          setLines((current) =>
            current.map((line) => (line.id === replyId ? { ...line, content: line.content + chunk } : line)),
          );
        } else if (event.type === "done") {
          finalReply = event.reply ?? null;
          if (event.approvalsCreated && event.approvalsCreated.length > 0) {
            setShowApprovalNotice(true);
            announceApprovalsChanged();
          }
        } else if (event.type === "error") {
          setError(event.error ?? "DOOMBOT could not answer.");
          status.fail("Couldn't get a reply. Try again");
        }
      });
      if (finalReply !== null) {
        status.done("Reply ready");
      }
      if (finalReply !== null) {
        const reply = finalReply;
        setLines((current) => current.map((line) => (line.id === replyId ? { ...line, content: reply } : line)));
      }
    } catch (caught) {
      if (controller.signal.aborted) {
        setError(null);
        status.done("Stopped");
      } else {
        status.fail("Couldn't get a reply. Try again");
        setError(caught instanceof Error ? caught.message : "DOOMBOT could not be reached. Check that the server is running.");
      }
    } finally {
      setLines((current) => current.filter((line) => !(line.id === replyId && line.content.length === 0)));
      abortRef.current = null;
      setSending(false);
      await reloadHistory(chatId).catch(() => undefined);
      await loadConversations().catch(() => undefined);
      composerRef.current?.focus();
    }
  }

  function stop() {
    abortRef.current?.abort();
    stopSpeaking();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void send(draft);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    const touchKeyboard = window.matchMedia("(pointer: coarse)").matches;
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing && !touchKeyboard) {
      event.preventDefault();
      void send(draft);
    }
  }

  async function copy(line: ChatLine) {
    try {
      await navigator.clipboard.writeText(line.content);
      setCopiedId(line.id);
      announceStatus("Copied to clipboard");
      setTimeout(() => setCopiedId((current) => (current === line.id ? null : current)), 1500);
    } catch {
      setError("Copy failed. Select the text and copy it manually.");
    }
  }

  const empty = loaded && lines.length === 0 && !sending;
  const selectedTitle = conversations.find((item) => item.id === selectedId)?.title ?? "New chat";

  return (
    <div className="relative flex h-full min-h-0">
      <aside
        className={`${showChats ? "absolute inset-y-0 left-0 z-20 flex w-72 max-w-[85%] flex-col border-r border-line bg-panel p-3 shadow-xl" : "hidden"} md:static md:flex md:w-64 md:shrink-0 md:flex-col md:border-r md:border-line md:bg-panel md:p-3 md:shadow-none`}
      >
        <ChatHistory
          conversations={conversations}
          selectedId={selectedId}
          onSelect={selectChat}
          onNew={() => void newChat()}
          onRename={(id, title) => void renameChat(id, title)}
          onDelete={(id) => void deleteChat(id)}
          onShare={(id) => void shareChat(id)}
        />
      </aside>
      {showChats && (
        <button type="button" aria-label="Close chats" onClick={() => setShowChats(false)} className="absolute inset-0 z-10 bg-black/50 md:hidden" />
      )}

      <div className="relative flex min-w-0 flex-1 flex-col">
        <div className="flex h-11 shrink-0 items-center gap-2 border-b border-line px-3 md:hidden">
          <button type="button" onClick={() => setShowChats(true)} className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-muted hover:bg-raised">
            <Icon name="list" size={18} />
            Chats
          </button>
          <span className="min-w-0 flex-1 truncate text-center text-sm font-medium">{selectedTitle}</span>
          <button type="button" onClick={() => void newChat()} aria-label="New chat" className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-raised">
            <Icon name="edit_square" size={18} />
          </button>
        </div>

        <div ref={scrollRef} onScroll={handleScroll} className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 md:gap-7 md:px-6 md:py-8">
            {empty && (
              <div className="flex flex-col items-center gap-6 pt-[8vh] text-center md:pt-[12vh]">
                <DoomMark size={56} />
                <div className="flex flex-col gap-2">
                  <p className="font-display text-xl font-semibold tracking-tight md:text-2xl">What do you need today?</p>
                  <p className="text-sm text-muted">Ask about your day, your inbox, your tasks or the weather.</p>
                </div>
                <div className="grid w-full max-w-xl grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-center">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => void send(suggestion)}
                      className="rounded-2xl border border-line bg-panel px-4 py-3 text-left text-sm leading-snug text-ink transition-colors hover:border-doom hover:bg-doom-soft sm:rounded-full sm:bg-transparent sm:py-2 sm:text-center"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {lines.filter((line) => line.role === "user" || line.content.length > 0 || !sending).map((line, index) =>
              line.role === "user" ? (
                <div key={line.id} className="group flex flex-col items-end gap-1">
                  {editingId === line.id ? (
                    <div className="flex w-full max-w-[85%] flex-col gap-2 rounded-2xl bg-raised p-3">
                      <textarea
                        value={editDraft}
                        onChange={(event) => setEditDraft(event.target.value)}
                        rows={3}
                        maxLength={4000}
                        aria-label="Edit message"
                        className="resize-none bg-transparent leading-relaxed outline-none"
                      />
                      <div className="flex justify-end gap-2 text-sm">
                        <button type="button" onClick={() => setEditingId(null)} className="rounded-lg px-3 py-1.5 text-muted hover:bg-panel">
                          Cancel
                        </button>
                        <button type="button" onClick={() => void saveEdit(line)} className="rounded-lg bg-doom px-3 py-1.5 font-semibold text-canvas">
                          Save and resend
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-raised px-4 py-2.5 leading-relaxed">
                        {line.content}
                      </p>
                      {line.id > 0 && !sending && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(line.id);
                            setEditDraft(line.content);
                          }}
                          className="rounded-md px-2 py-1 text-xs text-muted opacity-100 transition-opacity hover:bg-raised hover:text-ink md:opacity-0 md:group-hover:opacity-100"
                        >
                          Edit
                        </button>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div key={line.id} className="group flex gap-3">
                  <DoomMark size={28} />
                  <div className="min-w-0 flex-1 pt-0.5">
                    {line.content.length > 0 && <Markdown text={line.content} />}
                    {line.content.length > 0 && !sending && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {canSpeak() && (
                          <button
                            type="button"
                            onClick={() => {
                              speak(line.content);
                              announceStatus("Reading aloud");
                            }}
                            aria-label="Read this reply aloud"
                            className="rounded-md px-2 py-1 text-xs text-muted opacity-100 transition-opacity hover:bg-raised hover:text-ink md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
                          >
                            Read aloud
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => void copy(line)}
                          className="rounded-md px-2 py-1 text-xs text-muted opacity-100 transition-opacity hover:bg-raised hover:text-ink md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
                        >
                          {copiedId === line.id ? "Copied" : "Copy"}
                        </button>
                        {line.id > 0 && (
                          <button
                            type="button"
                            onClick={() => void regenerate(index)}
                            className="rounded-md px-2 py-1 text-xs text-muted opacity-100 transition-opacity hover:bg-raised hover:text-ink md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
                          >
                            Regenerate
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ),
            )}

            {shareNotice && (
              <div role="status" className="flex flex-col gap-2 rounded-xl border border-doom/50 px-4 py-3 text-sm">
                <p>Link copied. Anyone with this link can read this chat for 30 days, so share it only with people you trust.</p>
                <p className="break-all text-xs text-muted">{shareNotice.url}</p>
                <div className="flex gap-3">
                  <button type="button" onClick={() => void navigator.clipboard.writeText(shareNotice.url)} className="font-medium text-doom underline underline-offset-2">
                    Copy again
                  </button>
                  <button type="button" onClick={() => void stopSharing(shareNotice.id)} className="font-medium text-danger underline underline-offset-2">
                    Stop sharing
                  </button>
                  <button type="button" onClick={() => setShareNotice(null)} className="text-muted underline underline-offset-2">
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {showApprovalNotice && (
              <p className="rounded-xl border border-signal/40 px-4 py-3 text-sm">
                An action is waiting for you.{" "}
                <Link href="/approvals" className="font-medium text-signal underline underline-offset-2">
                  Review it in Approvals
                </Link>
              </p>
            )}

            {error && (
              <p role="alert" className="rounded-xl border border-danger/40 px-4 py-3 text-sm text-danger">
                {error}
              </p>
            )}

            <div ref={endRef} />
          </div>
        </div>

        {showJump && (
          <button
            type="button"
            onClick={jumpToLatest}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 rounded-full border border-line bg-panel px-4 py-2 text-sm shadow-lg md:bottom-28"
          >
            Jump to latest
          </button>
        )}

        <div className="shrink-0 bg-canvas px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:border-t md:border-line md:px-6 md:pt-3 md:pb-4">
          <StatusPill />
          {(pendingImage || pendingPdf || imageError) && (
            <div className="mx-auto mb-2 flex w-full max-w-3xl items-center gap-3 text-sm">
              {pendingImage && (
                <span className="flex items-center gap-2 rounded-xl border border-line bg-panel py-1 pr-1 pl-1">
                  <Image src={pendingImage} alt="Attached image preview" width={40} height={40} unoptimized className="h-10 w-10 rounded-lg object-cover" />
                  <span className="text-muted">Image attached</span>
                  <button type="button" onClick={() => setPendingImage(null)} aria-label="Remove image" className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-raised">
                    <Icon name="close" size={16} />
                  </button>
                </span>
              )}
              {pendingPdf && (
                <span className="flex items-center gap-2 rounded-xl border border-line bg-panel py-1 pr-1 pl-3">
                  <Icon name="picture_as_pdf" size={20} />
                  <span className="max-w-[10rem] truncate text-muted">{pendingPdf.name}</span>
                  <button type="button" onClick={() => setPendingPdf(null)} aria-label="Remove PDF" className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-raised">
                    <Icon name="close" size={16} />
                  </button>
                </span>
              )}
              {imageError && <span role="alert" className="text-danger">{imageError}</span>}
            </div>
          )}
          <form
            onSubmit={handleSubmit}
            className="mx-auto flex w-full max-w-3xl items-end gap-1 rounded-[1.75rem] sm:gap-2 border border-line bg-panel py-1.5 pr-1.5 pl-2 focus-within:border-doom"
          >
            <label htmlFor="composer" className="sr-only">
              Message DOOMBOT
            </label>
            <textarea
              id="composer"
              ref={composerRef}
              value={draft}
              rows={1}
              maxLength={4000}
              onChange={(event) => {
                setDraft(event.target.value);
                resizeComposer();
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ask DOOMBOT"
              className="max-h-[200px] min-h-[40px] min-w-0 flex-1 resize-none bg-transparent px-2 py-2 text-base sm:px-3 leading-relaxed outline-none placeholder:text-muted md:text-[15px]"
            />
            {!sending && (
              <button
                type="button"
                onClick={() => setThink((current) => !current)}
                aria-pressed={think}
                aria-label={think ? "Think mode on" : "Think mode off"}
                title={think ? "Think mode: slower, deeper answers" : "Fast mode: quick answers"}
                className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full px-2 text-sm transition-colors sm:px-3 ${
                  think ? "bg-doom-soft text-doom" : "text-muted hover:bg-raised hover:text-ink"
                }`}
              >
                <Icon name="psychology" size={20} />
                <span className="hidden sm:inline">{think ? "Think" : "Fast"}</span>
              </button>
            )}
            {!sending && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  className="hidden"
                  aria-label="Attach an image or PDF"
                  onChange={(event) => {
                    attachImage(event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Attach an image or PDF"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-raised hover:text-ink"
                >
                  <Icon name="add_photo_alternate" size={22} />
                </button>
              </>
            )}
            {!sending && <VoiceInput onTranscript={(text) => setDraft((current) => (current ? `${current} ${text}` : text))} />}
            {sending ? (
              <button
                type="button"
                onClick={stop}
                aria-label="Stop replying"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-raised text-ink"
              >
                <Icon name="stop" size={20} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={draft.trim().length === 0 && !pendingImage && !pendingPdf}
                aria-label="Send message"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-doom text-canvas transition-opacity disabled:opacity-40"
              >
                <Icon name="arrow_upward" size={22} />
              </button>
            )}
          </form>
          <p className="mx-auto mt-2 hidden w-full max-w-3xl text-center text-xs text-muted md:block">
            Enter to send, Shift+Enter for a new line. Actions that change things wait for your approval.
          </p>
        </div>
      </div>
    </div>
  );
}
