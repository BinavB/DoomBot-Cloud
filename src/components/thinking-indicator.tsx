"use client";

import { useEffect, useState } from "react";

const sparkFrames = ["·", "✢", "✳", "✶", "✻", "✽"];
const sparkIntervalMilliseconds = 140;

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
  const [frame, setFrame] = useState(sparkFrames.length - 1);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const spark = calm ? null : window.setInterval(() => setFrame((current) => (current + 1) % sparkFrames.length), sparkIntervalMilliseconds);
    const clock = window.setInterval(() => setSeconds((current) => current + 1), 1000);
    return () => {
      if (spark !== null) {
        window.clearInterval(spark);
      }
      window.clearInterval(clock);
    };
  }, []);

  const words = wordingFor(label.replace(/[….]+$/, ""), seconds);

  return (
    <span role="status" aria-live="polite" className="inline-flex min-w-0 items-center gap-2.5 text-sm">
      <span aria-hidden className="thinking-spark">
        {sparkFrames[frame]}
      </span>
      <span className="thinking-text truncate">{words}…</span>
      {seconds >= 3 && <span className="shrink-0 text-xs text-muted tabular-nums">{seconds}s</span>}
    </span>
  );
}
