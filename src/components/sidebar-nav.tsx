"use client";

import Link from "next/link";
import { DoomMark } from "@/components/doom-mark";
import { MobileNav } from "@/components/mobile-nav";
import { NavList } from "@/components/nav-list";
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
        <div className="min-h-0 flex-1 overflow-y-auto">
          <NavList pendingCount={navData.pendingCount} unreadCount={navData.unreadCount} />
        </div>
        <div className="flex gap-3 px-1 text-xs text-muted">
          <Link href="/privacy" className="hover:text-ink">Privacy</Link>
          <Link href="/terms" className="hover:text-ink">Terms</Link>
        </div>
        <UserMenu account={navData.account} />
      </nav>
      <MobileNav title={title} {...navData} />
    </>
  );
}
