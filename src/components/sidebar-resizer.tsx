"use client";

import { useRef, type KeyboardEvent, type PointerEvent } from "react";
import { setSidebarWidth, useSidebarWidth } from "@/components/sidebar-width-store";
import { defaultSidebarWidth, keyboardStep, maxSidebarWidth, minSidebarWidth } from "@/lib/sidebar-width";

export function SidebarResizer() {
  const width = useSidebarWidth();
  const drag = useRef<{ startX: number; startWidth: number } | null>(null);

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { startX: event.clientX, startWidth: width };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (drag.current) {
      setSidebarWidth(drag.current.startWidth + event.clientX - drag.current.startX, false);
    }
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current) {
      return;
    }
    setSidebarWidth(drag.current.startWidth + event.clientX - drag.current.startX, true);
    drag.current = null;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setSidebarWidth(width - keyboardStep, true);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      setSidebarWidth(width + keyboardStep, true);
    }
  }

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize sidebar"
      aria-valuemin={minSidebarWidth}
      aria-valuemax={maxSidebarWidth}
      aria-valuenow={width}
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onKeyDown={handleKeyDown}
      onDoubleClick={() => setSidebarWidth(defaultSidebarWidth, true)}
      className="group absolute inset-y-0 -right-1.5 z-10 flex w-3 cursor-col-resize touch-none justify-center"
    >
      <span className="h-full w-px bg-transparent transition-colors group-hover:bg-doom group-active:bg-doom group-focus-visible:bg-doom" />
    </div>
  );
}
