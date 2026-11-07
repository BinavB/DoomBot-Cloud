"use client";

import Link from "next/link";
import type { RefObject } from "react";
import type { ChatLine } from "@/app/_components/chat/chat-types";
import { suggestions } from "@/app/_components/chat/chat-types";
import { DoomMark } from "@/components/doom-mark";
import { Icon } from "@/components/icon";
import type { ShareNotice } from "@/components/chat-store";
import { Markdown } from "@/components/markdown";
import { canSpeak } from "@/lib/speech";

export interface MessageActions {
  onEdit: (line: ChatLine) => void;
  onCancelEdit: () => void;
  onSaveEdit: (line: ChatLine) => void;
  onCopy: (line: ChatLine) => void;
  onSpeak: (line: ChatLine) => void;
  onRate: (line: ChatLine, rating: number) => void;
  onRegenerate: (index: number) => void;
  onSuggest: (text: string) => void;
  onCopyShare: (url: string) => void;
  onStopSharing: (id: string) => void;
  onDismissShare: () => void;
}

interface ChatMessagesProps {
  lines: ChatLine[];
  empty: boolean;
  sending: boolean;
  editingId: number | null;
  editDraft: string;
  onEditDraft: (value: string) => void;
  copiedId: number | null;
  shareNotice: ShareNotice | null;
  showApprovalNotice: boolean;
  error: string | null;
  actions: MessageActions;
  endRef: RefObject<HTMLDivElement | null>;
}

const hoverReveal = "opacity-100 transition-opacity hover:bg-raised md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100";

function EmptyState({ onSuggest }: { onSuggest: (text: string) => void }) {
  return (
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
            onClick={() => onSuggest(suggestion)}
            className="rounded-2xl border border-line bg-panel px-4 py-3 text-left text-sm leading-snug text-ink transition-colors hover:border-doom hover:bg-doom-soft sm:rounded-full sm:bg-transparent sm:py-2 sm:text-center"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

function UserMessage({ line, editing, editDraft, sending, onEditDraft, actions }: {
  line: ChatLine;
  editing: boolean;
  editDraft: string;
  sending: boolean;
  onEditDraft: (value: string) => void;
  actions: MessageActions;
}) {
  if (editing) {
    return (
      <div className="flex w-full max-w-[85%] flex-col gap-2 self-end rounded-2xl bg-raised p-3">
        <textarea
          value={editDraft}
          onChange={(event) => onEditDraft(event.target.value)}
          rows={3}
          maxLength={4000}
          aria-label="Edit message"
          className="resize-none bg-transparent leading-relaxed outline-none"
        />
        <div className="flex justify-end gap-2 text-sm">
          <button type="button" onClick={actions.onCancelEdit} className="rounded-lg px-3 py-1.5 text-muted hover:bg-panel">
            Cancel
          </button>
          <button type="button" onClick={() => actions.onSaveEdit(line)} className="rounded-lg bg-doom px-3 py-1.5 font-semibold text-canvas">
            Save and resend
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="group flex flex-col items-end gap-1">
      <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-raised px-4 py-2.5 leading-relaxed">{line.content}</p>
      {line.id > 0 && !sending && (
        <button type="button" onClick={() => actions.onEdit(line)} className={`rounded-md px-2 py-1 text-xs text-muted hover:text-ink ${hoverReveal}`}>
          Edit
        </button>
      )}
    </div>
  );
}

function AssistantMessage({ line, index, copied, sending, actions }: {
  line: ChatLine;
  index: number;
  copied: boolean;
  sending: boolean;
  actions: MessageActions;
}) {
  const showActions = line.content.length > 0 && !sending;
  const rateButton = (rating: number, label: string, icon: string, active: boolean, activeClass: string) => (
    <button
      type="button"
      onClick={() => actions.onRate(line, rating)}
      aria-label={label}
      aria-pressed={active}
      className={`flex h-7 w-7 items-center justify-center rounded-md ${hoverReveal} ${active ? `${activeClass} md:opacity-100` : "text-muted hover:text-ink"}`}
    >
      <Icon name={icon} size={16} />
    </button>
  );
  return (
    <div className="group flex gap-3">
      <DoomMark size={28} />
      <div className="min-w-0 flex-1 pt-0.5">
        {line.content.length > 0 && <Markdown text={line.content} />}
        {showActions && (
          <div className="mt-2 flex flex-wrap gap-1">
            {canSpeak() && (
              <button type="button" onClick={() => actions.onSpeak(line)} aria-label="Read this reply aloud" className={`rounded-md px-2 py-1 text-xs text-muted hover:text-ink ${hoverReveal}`}>
                Read aloud
              </button>
            )}
            <button type="button" onClick={() => actions.onCopy(line)} className={`rounded-md px-2 py-1 text-xs text-muted hover:text-ink ${hoverReveal}`}>
              {copied ? "Copied" : "Copy"}
            </button>
            {line.id > 0 && (
              <>
                {rateButton(1, "Good reply", "thumb_up", line.rating === 1, "text-doom")}
                {rateButton(-1, "Bad reply", "thumb_down", line.rating === -1, "text-danger")}
                <button type="button" onClick={() => actions.onRegenerate(index)} className={`rounded-md px-2 py-1 text-xs text-muted hover:text-ink ${hoverReveal}`}>
                  Regenerate
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function ChatMessages({ lines, empty, sending, editingId, editDraft, onEditDraft, copiedId, shareNotice, showApprovalNotice, error, actions, endRef }: ChatMessagesProps) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 md:gap-7 md:px-6 md:py-8">
      {empty && <EmptyState onSuggest={actions.onSuggest} />}

      {lines.map((line, index) =>
        line.role === "user" ? (
          <UserMessage key={line.id} line={line} editing={editingId === line.id} editDraft={editDraft} sending={sending} onEditDraft={onEditDraft} actions={actions} />
        ) : (
          <AssistantMessage key={line.id} line={line} index={index} copied={copiedId === line.id} sending={sending} actions={actions} />
        ),
      )}

      {shareNotice && (
        <div role="status" className="flex flex-col gap-2 rounded-xl border border-doom/50 px-4 py-3 text-sm">
          <p>Link copied. Anyone with this link can read this chat for 30 days, so share it only with people you trust.</p>
          <p className="break-all text-xs text-muted">{shareNotice.url}</p>
          <div className="flex gap-3">
            <button type="button" onClick={() => actions.onCopyShare(shareNotice.url)} className="font-medium text-doom underline underline-offset-2">
              Copy again
            </button>
            <button type="button" onClick={() => actions.onStopSharing(shareNotice.id)} className="font-medium text-danger underline underline-offset-2">
              Stop sharing
            </button>
            <button type="button" onClick={actions.onDismissShare} className="text-muted underline underline-offset-2">
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
  );
}
