"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { DoomMark } from "@/components/doom-mark";
import { Icon } from "@/components/icon";
import { InstallButton } from "@/components/install-button";
import { SidebarChats } from "@/components/sidebar-chats";
import { SidebarPages } from "@/components/sidebar-pages";
import type { NavData } from "@/components/use-nav-data";
import { UserMenu } from "@/components/user-menu";

const iconButton =
  "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink transition-colors hover:bg-raised";

export function MobileNav({ title, actions, pendingCount, unreadCount, account }: NavData & { title: string; actions?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  function close() {
    setOpen(false);
    menuButtonRef.current?.focus();
  }

  useEffect(() => {
    if (!open) {
      return;
    }
    closeButtonRef.current?.focus();
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        menuButtonRef.current?.focus();
      }
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    <>
      <header className="shrink-0 border-b border-line bg-canvas pt-[env(safe-area-inset-top)] md:hidden">
        <div className="relative flex h-14 items-center gap-1 px-2">
          <button
            ref={menuButtonRef}
            data-tour="mobile-menu"
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
            aria-controls="mobile-menu"
            className={iconButton}
          >
            <Icon name="menu" size={24} />
            {pendingCount > 0 && <span aria-hidden className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-doom" />}
          </button>
          <h1 className="pointer-events-none absolute inset-x-28 truncate text-center font-display text-base font-semibold">{title}</h1>
          <div className="flex-1" />
          {actions}
          <InstallButton variant="icon" />
          <Link href="/alerts" aria-label={unreadCount > 0 ? `Alerts, ${unreadCount} unread` : "Alerts"} className={iconButton}>
            <Icon name="notifications" size={22} />
            {unreadCount > 0 && <span aria-hidden className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-danger" />}
          </Link>
        </div>
      </header>

      <div className={`fixed inset-0 z-40 md:hidden ${open ? "" : "pointer-events-none"}`} inert={!open}>
        <div
          aria-hidden
          onClick={close}
          className={`absolute inset-0 bg-black/60 transition-opacity duration-200 motion-reduce:transition-none ${
            open ? "opacity-100" : "opacity-0"
          }`}
        />
        <nav
          id="mobile-menu"
          aria-label="Main"
          className={`absolute inset-y-0 left-0 flex w-[82%] max-w-xs flex-col gap-6 border-r border-line bg-panel px-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-[max(1.25rem,env(safe-area-inset-bottom))] transition-transform duration-200 ease-out motion-reduce:transition-none ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between">
            <Link href="/" onClick={close} className="flex items-center gap-2.5 rounded-lg px-1">
              <DoomMark size={32} />
              <span className="font-display text-lg font-semibold tracking-tight">DOOMBOT</span>
            </Link>
            <button ref={closeButtonRef} type="button" onClick={close} aria-label="Close menu" className={iconButton}>
              <Icon name="close" size={22} />
            </button>
          </div>
          <SidebarChats
            onNavigate={close}
            pages={<SidebarPages pendingCount={pendingCount} unreadCount={unreadCount} onNavigate={close} />}
          />
          <UserMenu account={account} pendingCount={pendingCount} unreadCount={unreadCount} showPages={false} />
        </nav>
      </div>
    </>
  );
}
