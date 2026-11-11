"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import { Icon } from "@/components/icon";
import { installApp, isInstalled, subscribeInstall } from "@/components/install-prompt";
import { Menu, type MenuItem } from "@/components/menu";
import { pageLinks } from "@/components/page-links";
import { replayTours } from "@/components/tour/tour-store";
import type { Account } from "@/components/use-nav-data";

interface UserMenuProps {
  account: Account | null;
  pendingCount: number;
  unreadCount: number;
  showPages?: boolean;
}

function Avatar({ account, size }: { account: Account; size: number }) {
  if (account.picture) {
    return (
      <Image
        src={account.picture}
        alt=""
        width={size}
        height={size}
        unoptimized
        referrerPolicy="no-referrer"
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-full bg-raised text-sm font-semibold text-doom"
      style={{ width: size, height: size }}
    >
      {account.name.charAt(0).toUpperCase()}
    </span>
  );
}

export function UserMenu({ account, pendingCount, unreadCount, showPages = true }: UserMenuProps) {
  const router = useRouter();
  const installed = useSyncExternalStore(subscribeInstall, isInstalled, () => false);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  if (!account) {
    return null;
  }

  const items: MenuItem[] = [
    ...(showPages ? pageLinks(pendingCount, unreadCount) : []),
    { label: "Settings", icon: "tune", href: "/settings", separatorBefore: showPages },
    ...(installed ? [] : [{ label: "Install app", hint: "Add DOOMBOT as a shortcut", icon: "download", onSelect: () => void installApp() }]),
    { label: "Replay tour", icon: "school", onSelect: replayTours },
    ...(account.guest
      ? [{ label: "Sign in with Google", hint: "Keep your chats and turn on Google features", icon: "login", separatorBefore: true, onSelect: () => window.location.assign(new URL("/api/auth/google/start", window.location.origin)) }]
      : []),
    { label: account.guest ? "Leave guest mode" : "Sign out", icon: "logout", separatorBefore: !account.guest, onSelect: () => void signOut() },
  ];
  const subtitle = account.guest ? "Guest, not signed in" : account.email;

  const attention = pendingCount + unreadCount > 0;

  return (
    <div data-tour="account-menu" className="border-t border-line pt-3">
      <Menu
        label="Account menu"
        direction="up"
        align="start"
        width="w-72"
        items={items}
        header={<p className="truncate px-3 pt-2 pb-2 text-sm text-muted">{subtitle}</p>}
        triggerClassName="relative flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-raised"
        trigger={
          <>
            <Avatar account={account} size={36} />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium">{account.name}</span>
              <span className="truncate text-xs text-muted">{subtitle}</span>
            </span>
            {attention && <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-danger" />}
            <Icon name="unfold_more" size={18} className="text-muted" />
          </>
        }
      />
    </div>
  );
}
