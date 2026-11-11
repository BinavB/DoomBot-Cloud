"use client";

import { useEffect, useRef, useState } from "react";

const nearBottomPixels = 96;

export function useChatScroll(lines: unknown[], busy: boolean) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const hadItems = useRef(false);
  const wasBusy = useRef(false);
  const [showJump, setShowJump] = useState(false);

  useEffect(() => {
    const first = !hadItems.current;
    hadItems.current = lines.length > 0;
    if (!stickToBottom.current) {
      return;
    }
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    endRef.current?.scrollIntoView({ behavior: first || reduceMotion ? "auto" : "smooth", block: "end" });
  }, [lines]);

  useEffect(() => {
    const finished = wasBusy.current && !busy;
    wasBusy.current = busy;
    if (!finished) {
      return;
    }
    const replies = scrollRef.current?.querySelectorAll("[data-assistant]");
    const start = replies?.[replies.length - 1];
    if (!start) {
      return;
    }
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    stickToBottom.current = false;
    start.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }, [busy]);

  function handleScroll() {
    const element = scrollRef.current;
    if (!element) {
      return;
    }
    const distance = element.scrollHeight - element.scrollTop - element.clientHeight;
    stickToBottom.current = distance < nearBottomPixels;
    setShowJump(!stickToBottom.current);
  }

  function pinToBottom() {
    stickToBottom.current = true;
    setShowJump(false);
  }

  function jumpToLatest() {
    pinToBottom();
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }

  return { scrollRef, endRef, showJump, handleScroll, pinToBottom, jumpToLatest };
}
