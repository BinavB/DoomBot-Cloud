"use client";

import { useEffect } from "react";

export function useEscape(onEscape: () => void, active = true): void {
  useEffect(() => {
    if (!active) {
      return;
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopImmediatePropagation();
        onEscape();
      }
    }
    window.addEventListener("keydown", handleKey, true);
    return () => window.removeEventListener("keydown", handleKey, true);
  }, [onEscape, active]);
}
