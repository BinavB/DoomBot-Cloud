"use client";

import { useEffect, useState } from "react";

const glyphs = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=<>";
const durationMilliseconds = 900;

function scramble(text: string, progress: number): string {
  const settled = Math.floor(text.length * progress);
  return Array.from(text, (character, index) => {
    if (index < settled || character === " ") {
      return character;
    }
    return glyphs[Math.floor(Math.random() * glyphs.length)];
  }).join("");
}

export function useDecodeText(text: string): string {
  const [shown, setShown] = useState(text);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    let frame = 0;
    const startedAt = performance.now();
    function tick(now: number) {
      const progress = Math.min(1, (now - startedAt) / durationMilliseconds);
      setShown(progress >= 1 ? text : scramble(text, progress));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [text]);

  return shown;
}
