"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { DoomMark } from "@/components/doom-mark";
import { MobileNav } from "@/components/mobile-nav";
import { SidebarChats } from "@/components/sidebar-chats";
import { SidebarResizer } from "@/components/sidebar-resizer";
import { useSidebarWidth } from "@/components/sidebar-width-store";
import { useNavData } from "@/components/use-nav-data";
import { UserMenu } from "@/components/user-menu";

export function SidebarNav({ title, actions }: { title: string; actions?: ReactNode }) {
  const navData = useNavData();
  const width = useSidebarWidth();

  return (
    <>
      <nav
        aria-label="Main"
        style={{ width }}
        className="relative hidden shrink-0 flex-col gap-6 border-r border-line bg-panel px-4 py-5 md:flex"
      >
        <Link href="/" className="flex items-center gap-2.5 rounded-lg px-1">
          <DoomMark size={30} />
          <span className="font-display text-lg font-semibold tracking-tight">DOOMBOT</span>
        </Link>
        <SidebarChats />
        <UserMenu account={navData.account} pendingCount={navData.pendingCount} unreadCount={navData.unreadCount} />
        <SidebarResizer />
      </nav>
      <MobileNav title={title} actions={actions} {...navData} />
    </>
  );
}
