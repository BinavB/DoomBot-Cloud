"use client";

import { useEffect, useState } from "react";

const dotCount = 6;

function wordingFor(label: string, seconds: number): string {
  if (seconds >= 20) {
    return "Still working on it";
  }
  if (seconds >= 8) {
    return "Working on it";
  }
  return label;
}

export function ThinkingIndicator({ label = "Thinking" }: { label?: string }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const clock = window.setInterval(() => setSeconds((current) => current + 1), 1000);
    return () => window.clearInterval(clock);
  }, []);

  const words = wordingFor(label.replace(/[….]+$/, ""), seconds);

  return (
    <span role="status" aria-live="polite" className="inline-flex min-w-0 items-center gap-2.5 text-sm">
      <span aria-hidden className="thinking-dots">
        {Array.from({ length: dotCount }, (_, index) => (
          <span key={index} style={{ animationDelay: `${index * 0.15}s` }} />
        ))}
      </span>
      <span className="thinking-text truncate">{words}…</span>
      {seconds >= 3 && <span className="shrink-0 text-xs text-muted tabular-nums">{seconds}s</span>}
    </span>
  );
}
