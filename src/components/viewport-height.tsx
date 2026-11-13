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
    let baselineHeight = viewport.height;
    let baselineWidth = viewport.width;

    function update() {
      if (!viewport) {
        return;
      }
      if (viewport.width !== baselineWidth) {
        baselineWidth = viewport.width;
        baselineHeight = viewport.height;
      }
      const keyboardOpen = baselineHeight - viewport.height > keyboardThresholdPixels;
      if (!keyboardOpen) {
        baselineHeight = viewport.height;
      }
      root.style.setProperty("--app-height", `${viewport.height}px`);
      root.style.setProperty("--app-top", `${viewport.offsetTop}px`);
      root.style.setProperty("--full-height", `${baselineHeight}px`);
      root.dataset.keyboard = keyboardOpen ? "open" : "closed";
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
