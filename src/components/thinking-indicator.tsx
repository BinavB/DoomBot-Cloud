"use client";

import { useEffect, useState } from "react";

const sparkFrames = ["·", "✢", "✳", "✶", "✻", "✽"];
const sparkIntervalMilliseconds = 140;
const wordIntervalMilliseconds = 2600;
const defaultLabel = "Thinking";

const thinkingWords = [
  "Scheming",
  "Plotting",
  "Calculating",
  "Scanning",
  "Cogitating",
  "Brooding",
  "Conjuring",
  "Deliberating",
  "Pondering",
  "Hatching a plan",
  "Consulting the archives",
  "Charging the core",
  "Decrypting",
  "Forging an answer",
  "Plotting world domination",
  "Reticulating circuits",
  "Muttering darkly",
  "Computing doom",
];

function randomWord(except: string): string {
  const choices = thinkingWords.filter((word) => word !== except);
  return choices[Math.floor(Math.random() * choices.length)];
}

export function ThinkingIndicator({ label = defaultLabel }: { label?: string }) {
  const [frame, setFrame] = useState(sparkFrames.length - 1);
  const [seconds, setSeconds] = useState(0);
  const [word, setWord] = useState(defaultLabel);
  const randomised = label === defaultLabel;

  useEffect(() => {
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const spark = calm ? null : window.setInterval(() => setFrame((current) => (current + 1) % sparkFrames.length), sparkIntervalMilliseconds);
    const clock = window.setInterval(() => setSeconds((current) => current + 1), 1000);
    const shuffler = randomised ? window.setInterval(() => setWord((current) => randomWord(current)), wordIntervalMilliseconds) : null;
    if (randomised) {
      const first = window.setTimeout(() => setWord((current) => randomWord(current)), 0);
      return () => {
        window.clearTimeout(first);
        if (spark !== null) {
          window.clearInterval(spark);
        }
        window.clearInterval(clock);
        if (shuffler !== null) {
          window.clearInterval(shuffler);
        }
      };
    }
    return () => {
      if (spark !== null) {
        window.clearInterval(spark);
      }
      window.clearInterval(clock);
    };
  }, [randomised]);

  const words = randomised ? word : label.replace(/[….]+$/, "");

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
