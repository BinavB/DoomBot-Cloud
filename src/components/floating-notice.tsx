import type { ReactNode } from "react";

type NoticeTone = "error" | "success" | "neutral";

const toneClasses: Record<NoticeTone, string> = {
  error: "border-danger/60 text-danger",
  success: "border-doom/60 text-ink",
  neutral: "border-line text-ink",
};

export function FloatingNotice({ tone = "success", children }: { tone?: NoticeTone; children: ReactNode }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[max(3.75rem,calc(env(safe-area-inset-top)+3rem))] z-40 flex justify-center px-4">
      <div
        role={tone === "error" ? "alert" : "status"}
        className={`pointer-events-auto max-w-[min(36rem,100%)] rounded-2xl border bg-raised/60 px-4 py-3 text-sm shadow-lg backdrop-blur-md ${toneClasses[tone]}`}
      >
        {children}
      </div>
    </div>
  );
}
