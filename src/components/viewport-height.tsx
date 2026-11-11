"use client";

import { useEffect } from "react";

const keyboardThresholdPixels = 120;

export function ViewportHeight() {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) {
      return;
    }
    const root = document.documentElement;

    function update() {
      if (!viewport) {
        return;
      }
      root.style.setProperty("--app-height", `${viewport.height}px`);
      root.style.setProperty("--app-top", `${viewport.offsetTop}px`);
      root.dataset.keyboard = window.innerHeight - viewport.height > keyboardThresholdPixels ? "open" : "closed";
    }

    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, []);

  return null;
}
