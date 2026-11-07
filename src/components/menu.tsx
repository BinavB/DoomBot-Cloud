"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/icon";

export interface MenuItem {
  label: string;
  hint?: string;
  icon?: string;
  href?: string;
  download?: boolean;
  danger?: boolean;
  selected?: boolean;
  badge?: number;
  separatorBefore?: boolean;
  onSelect?: () => void;
}

interface MenuProps {
  label: string;
  trigger: ReactNode;
  items: MenuItem[];
  direction?: "down" | "up";
  align?: "start" | "end";
  triggerClassName?: string;
  width?: string;
  header?: ReactNode;
}

export function Menu({ label, trigger, items, direction = "down", align = "end", triggerClassName = "", width = "w-64", header }: MenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }
    function closeOnOutside(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const itemClass = (item: MenuItem) =>
    `flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-raised ${item.danger ? "text-danger" : "text-ink"}`;

  const content = (item: MenuItem) => (
    <>
      {item.icon && <Icon name={item.icon} size={20} className="mt-0.5" />}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="font-medium">{item.label}</span>
        {item.hint && <span className="text-xs leading-snug text-muted">{item.hint}</span>}
      </span>
      {item.badge !== undefined && item.badge > 0 && (
        <span className="mt-0.5 rounded-full bg-doom px-2 py-0.5 text-xs font-semibold text-canvas">{item.badge}</span>
      )}
      {item.selected && <Icon name="check" size={18} className="mt-0.5 text-doom" />}
    </>
  );

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
        className={triggerClassName}
      >
        {trigger}
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          className={`absolute z-40 ${width} max-w-[calc(100vw-1.5rem)] rounded-xl border border-line bg-panel p-1.5 shadow-xl ${
            direction === "up" ? "bottom-full mb-2" : "top-full mt-2"
          } ${align === "end" ? "right-0" : "left-0"}`}
        >
          {header}
          {items.map((item) => (
            <div key={item.label}>
              {item.separatorBefore && <div role="separator" className="my-1 border-t border-line" />}
              {item.href ? (
                item.download ? (
                  <a role="menuitem" href={item.href} download className={itemClass(item)} onClick={() => setOpen(false)}>
                    {content(item)}
                  </a>
                ) : (
                  <Link role="menuitem" href={item.href} className={itemClass(item)} onClick={() => setOpen(false)}>
                    {content(item)}
                  </Link>
                )
              ) : (
                <button
                  type="button"
                  role="menuitem"
                  className={itemClass(item)}
                  onClick={() => {
                    setOpen(false);
                    item.onSelect?.();
                  }}
                >
                  {content(item)}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
