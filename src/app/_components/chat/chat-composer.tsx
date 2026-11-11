"use client";

import Image from "next/image";
import { useRef, type FormEvent, type KeyboardEvent, type RefObject } from "react";
import type { AttachmentsApi } from "@/app/_components/chat/use-attachments";
import { VoiceInput } from "@/app/_components/voice-input";
import { Icon } from "@/components/icon";

interface ChatComposerProps {
  draft: string;
  onDraft: (value: string) => void;
  composerRef: RefObject<HTMLTextAreaElement | null>;
  busy: boolean;
  attachments: AttachmentsApi;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onStop: () => void;
  onTranscript: (text: string) => void;
}

export function ChatComposer({ draft, onDraft, composerRef, busy, attachments, onSubmit, onKeyDown, onStop, onTranscript }: ChatComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasAttachment = attachments.image !== null || attachments.pdf !== null;

  return (
    <div className="shrink-0 bg-canvas px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:px-6 md:pt-3 md:pb-4">
      {(hasAttachment || attachments.error) && (
        <div className="mx-auto mb-2 flex w-full max-w-3xl items-center gap-3 text-sm">
          {attachments.image && (
            <span className="flex items-center gap-2 rounded-xl border border-line bg-panel py-1 pr-1 pl-1">
              <Image src={attachments.image} alt="Attached image preview" width={40} height={40} unoptimized className="h-10 w-10 rounded-lg object-cover" />
              <span className="text-muted">Image attached</span>
              <button type="button" onClick={attachments.removeImage} aria-label="Remove image" className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-raised">
                <Icon name="close" size={16} />
              </button>
            </span>
          )}
          {attachments.pdf && (
            <span className="flex items-center gap-2 rounded-xl border border-line bg-panel py-1 pr-1 pl-3">
              <Icon name="picture_as_pdf" size={20} />
              <span className="max-w-[10rem] truncate text-muted">{attachments.pdf.name}</span>
              <button type="button" onClick={attachments.removePdf} aria-label="Remove PDF" className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-raised">
                <Icon name="close" size={16} />
              </button>
            </span>
          )}
          {attachments.error && <span role="alert" className="text-danger">{attachments.error}</span>}
        </div>
      )}
      <form data-tour="composer" onSubmit={onSubmit} className="mx-auto flex w-full max-w-3xl items-end gap-1 rounded-[1.75rem] border border-line bg-panel py-1.5 pr-1.5 pl-2 focus-within:border-doom sm:gap-2">
        <label htmlFor="composer" className="sr-only">
          Message DOOMBOT
        </label>
        <textarea
          id="composer"
          ref={composerRef}
          value={draft}
          rows={1}
          maxLength={4000}
          onChange={(event) => onDraft(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask DOOMBOT"
          className="max-h-[200px] min-h-[40px] min-w-0 flex-1 resize-none bg-transparent px-2 py-2 text-base leading-relaxed outline-none placeholder:text-muted sm:px-3 md:text-[15px]"
        />
        {!busy && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,application/pdf"
              className="hidden"
              aria-label="Attach an image or PDF"
              onChange={(event) => {
                attachments.attach(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
            <button type="button" data-tour="composer-attach" onClick={() => fileInputRef.current?.click()} aria-label="Attach an image or PDF" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-raised hover:text-ink">
              <Icon name="add_photo_alternate" size={22} />
            </button>
            <VoiceInput onTranscript={onTranscript} />
          </>
        )}
        {busy ? (
          <button type="button" onClick={onStop} aria-label="Stop replying" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-raised text-ink">
            <Icon name="stop" size={20} />
          </button>
        ) : (
          <button
            type="submit"
            disabled={draft.trim().length === 0 && !hasAttachment}
            aria-label="Send message"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-doom text-canvas transition-opacity disabled:opacity-40"
          >
            <Icon name="arrow_upward" size={22} />
          </button>
        )}
      </form>
    </div>
  );
}
