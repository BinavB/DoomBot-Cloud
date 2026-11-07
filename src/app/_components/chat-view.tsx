"use client";

import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ChatComposer } from "@/app/_components/chat/chat-composer";
import { ChatMessages, type MessageActions } from "@/app/_components/chat/chat-messages";
import { lastUserBefore, visibleLines, type ChatLine } from "@/app/_components/chat/chat-types";
import { useAttachments } from "@/app/_components/chat/use-attachments";
import { useChatHistory } from "@/app/_components/chat/use-chat-history";
import { useChatScroll } from "@/app/_components/chat/use-chat-scroll";
import { createChat, dismissShareNotice, refreshChats, setChatBusy, setChatError, setMode, stopSharing, useChatState } from "@/components/chat-store";
import { announceApprovalsChanged } from "@/components/events";
import { Icon } from "@/components/icon";
import { announceStatus, startStatus } from "@/components/status-store";
import { readEvents } from "@/lib/chat-stream";
import { speak, stopSpeaking } from "@/lib/speech";

const composerMaxHeight = 200;

export function ChatView() {
  const { conversations, selectedId, ready, busy, mode, error, shareNotice } = useChatState();
  const history = useChatHistory(selectedId, ready, busy);
  const attachments = useAttachments();
  const { scrollRef, endRef, showJump, handleScroll, pinToBottom, jumpToLatest } = useChatScroll(history.lines);
  const think = mode === "think";

  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [showApprovalNotice, setShowApprovalNotice] = useState(false);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const nextLocalId = useRef(-1);

  const lines = history.lines;
  const visible = visibleLines(lines, busy);
  const empty = history.loaded && lines.length === 0 && !busy;
  const selectedTitle = conversations.find((item) => item.id === selectedId)?.title ?? "New chat";

  function resizeComposer() {
    const element = composerRef.current;
    if (!element) {
      return;
    }
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, composerMaxHeight)}px`;
  }

  function patch(chatId: string, id: number, change: (line: ChatLine) => ChatLine) {
    history.update(chatId, (current) => current.map((line) => (line.id === id ? change(line) : line)));
  }

  async function rewindTo(chatId: string, messageId: number): Promise<boolean> {
    const response = await fetch("/api/chat/rewind", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: chatId, messageId }),
    });
    return response.ok;
  }

  async function send(text: string) {
    const attached = attachments.image;
    const attachedPdf = attachments.pdf;
    const typed = text.trim();
    const fallback = attachedPdf ? "Summarize this document." : attached ? "What is in this image?" : "";
    const message = typed.length > 0 ? typed : fallback;
    if (message.length === 0 || busy) {
      return;
    }
    attachments.clear();
    setChatBusy(true);
    setChatError(null);
    setShowApprovalNotice(false);
    setDraft("");
    requestAnimationFrame(resizeComposer);
    pinToBottom();

    const chatId = selectedId ?? (await createChat());
    if (!chatId) {
      setChatBusy(false);
      return;
    }

    const userId = nextLocalId.current--;
    const replyId = nextLocalId.current--;
    history.update(chatId, (current) => [
      ...current,
      { id: userId, role: "user", content: message, rating: 0 },
      { id: replyId, role: "assistant", content: "", rating: 0 },
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
          patch(chatId, replyId, (line) => ({ ...line, content: line.content + chunk }));
        } else if (event.type === "done") {
          finalReply = event.reply ?? null;
          if (event.approvalsCreated && event.approvalsCreated.length > 0) {
            setShowApprovalNotice(true);
            announceApprovalsChanged();
          }
        } else if (event.type === "error") {
          setChatError(event.error ?? "DOOMBOT could not answer.");
          status.fail("Couldn't get a reply. Try again");
        }
      });
      if (finalReply !== null) {
        status.done("Reply ready");
        const reply = finalReply;
        patch(chatId, replyId, (line) => ({ ...line, content: reply }));
      }
    } catch (caught) {
      if (controller.signal.aborted) {
        setChatError(null);
        status.done("Stopped");
      } else {
        status.fail("Couldn't get a reply. Try again");
        setChatError(caught instanceof Error ? caught.message : "DOOMBOT could not be reached. Check that the server is running.");
      }
    } finally {
      history.update(chatId, (current) => current.filter((line) => !(line.id === replyId && line.content.length === 0)));
      abortRef.current = null;
      setChatBusy(false);
      await history.reload(chatId).catch(() => undefined);
      await refreshChats().catch(() => undefined);
      composerRef.current?.focus();
    }
  }

  async function regenerate(index: number) {
    const chatId = selectedId;
    if (busy || !chatId) {
      return;
    }
    const userLine = lastUserBefore(lines, index);
    if (!userLine || userLine.id <= 0) {
      setChatError("Reload the page before regenerating this reply.");
      return;
    }
    if (!(await rewindTo(chatId, userLine.id))) {
      setChatError("The reply could not be regenerated.");
      return;
    }
    await history.reload(chatId);
    await send(userLine.content);
  }

  async function saveEdit(line: ChatLine) {
    const chatId = selectedId;
    const text = editDraft.trim();
    if (busy || !chatId || text.length === 0) {
      return;
    }
    setEditingId(null);
    if (!(await rewindTo(chatId, line.id))) {
      setChatError("The message could not be edited.");
      return;
    }
    await history.reload(chatId);
    await send(text);
  }

  async function rate(line: ChatLine, rating: number) {
    const chatId = selectedId;
    if (!chatId) {
      return;
    }
    const next = line.rating === rating ? 0 : rating;
    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId: line.id, rating: next }),
    });
    if (response.ok) {
      patch(chatId, line.id, (item) => ({ ...item, rating: next }));
    }
  }

  async function copy(line: ChatLine) {
    try {
      await navigator.clipboard.writeText(line.content);
      setCopiedId(line.id);
      announceStatus("Copied to clipboard");
      setTimeout(() => setCopiedId((current) => (current === line.id ? null : current)), 1500);
    } catch {
      setChatError("Copy failed. Select the text and copy it manually.");
    }
  }

  function stop() {
    abortRef.current?.abort();
    stopSpeaking();
  }

  const actions: MessageActions = {
    onEdit: (line) => {
      setEditingId(line.id);
      setEditDraft(line.content);
    },
    onCancelEdit: () => setEditingId(null),
    onSaveEdit: (line) => void saveEdit(line),
    onCopy: (line) => void copy(line),
    onSpeak: (line) => {
      speak(line.content);
      announceStatus("Reading aloud");
    },
    onRate: (line, rating) => void rate(line, rating),
    onRegenerate: (index) => void regenerate(index),
    onSuggest: (text) => void send(text),
    onCopyShare: (url) => void navigator.clipboard.writeText(url),
    onStopSharing: (id) => void stopSharing(id),
    onDismissShare: dismissShareNotice,
  };

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

  return (
    <div className="relative flex h-full min-h-0 min-w-0 flex-1 flex-col">
      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-line px-3 md:hidden">
        <span className="min-w-0 flex-1 truncate text-center text-sm font-medium">{selectedTitle}</span>
        <button type="button" onClick={() => void createChat()} aria-label="New chat" className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-raised">
          <Icon name="edit_square" size={18} />
        </button>
      </div>

      <div ref={scrollRef} onScroll={handleScroll} className="min-h-0 flex-1 overflow-y-auto">
        <ChatMessages
          lines={visible}
          empty={empty}
          sending={busy}
          editingId={editingId}
          editDraft={editDraft}
          onEditDraft={setEditDraft}
          copiedId={copiedId}
          shareNotice={shareNotice}
          showApprovalNotice={showApprovalNotice}
          error={error}
          actions={actions}
          endRef={endRef}
        />
      </div>

      {showJump && (
        <button type="button" onClick={jumpToLatest} className="absolute bottom-24 left-1/2 -translate-x-1/2 rounded-full border border-line bg-panel px-4 py-2 text-sm shadow-lg md:bottom-28">
          Jump to latest
        </button>
      )}

      <ChatComposer
        draft={draft}
        onDraft={(value) => {
          setDraft(value);
          resizeComposer();
        }}
        composerRef={composerRef}
        busy={busy}
        think={think}
        onToggleThink={() => setMode(think ? "fast" : "think")}
        attachments={attachments}
        onSubmit={handleSubmit}
        onKeyDown={handleKeyDown}
        onStop={stop}
        onTranscript={(text) => setDraft((current) => (current ? `${current} ${text}` : text))}
      />
    </div>
  );
}
