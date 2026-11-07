"use client";

import Link from "next/link";
import { DoomMark } from "@/components/doom-mark";
import { MobileNav } from "@/components/mobile-nav";
import { SidebarChats } from "@/components/sidebar-chats";
import { useNavData } from "@/components/use-nav-data";
import { UserMenu } from "@/components/user-menu";

export function SidebarNav({ title }: { title: string }) {
  const navData = useNavData();

  return (
    <>
      <nav
        aria-label="Main"
        className="hidden w-60 shrink-0 flex-col gap-6 border-r border-line bg-panel px-4 py-5 md:flex"
      >
        <Link href="/" className="flex items-center gap-2.5 rounded-lg px-1">
          <DoomMark size={30} />
          <span className="font-display text-lg font-semibold tracking-tight">DOOMBOT</span>
        </Link>
        <SidebarChats />
        <UserMenu account={navData.account} pendingCount={navData.pendingCount} unreadCount={navData.unreadCount} />
      </nav>
      <MobileNav title={title} {...navData} />
    </>
  );
}
