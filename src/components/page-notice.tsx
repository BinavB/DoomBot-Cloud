"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";

export const pageNoticesId = "page-notices";

type NoticeTone = "error" | "success" | "neutral";

const toneClasses: Record<NoticeTone, string> = {
  error: "border-danger/60 text-danger",
  success: "border-doom/60 text-ink",
  neutral: "border-line text-ink",
};

function subscribeNever(): () => void {
  return () => undefined;
}

function findNoticeSlot(): HTMLElement | null {
  return document.getElementById(pageNoticesId);
}

export function PageNotice({ tone = "success", children }: { tone?: NoticeTone; children: ReactNode }) {
  const slot = useSyncExternalStore(subscribeNever, findNoticeSlot, () => null);
  const notice = (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`w-full max-w-[min(36rem,100%)] rounded-2xl border bg-raised/60 px-4 py-3 text-sm backdrop-blur-md ${toneClasses[tone]}`}
    >
      {children}
    </div>
  );
  return slot ? createPortal(notice, slot) : notice;
}
