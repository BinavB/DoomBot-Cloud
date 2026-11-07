"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import { Icon } from "@/components/icon";
import { installApp, isInstalled, subscribeInstall } from "@/components/install-prompt";
import { Menu, type MenuItem } from "@/components/menu";
import type { Account } from "@/components/use-nav-data";

interface UserMenuProps {
  account: Account | null;
  pendingCount: number;
  unreadCount: number;
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

export function UserMenu({ account, pendingCount, unreadCount }: UserMenuProps) {
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
    { label: "Doombots", icon: "smart_toy", href: "/bots" },
    { label: "Alerts", icon: "notifications", href: "/alerts", badge: unreadCount },
    { label: "Briefing", icon: "wb_twilight", href: "/briefing" },
    { label: "To-do", icon: "task_alt", href: "/todos" },
    { label: "Approvals", icon: "verified_user", href: "/approvals", badge: pendingCount },
    { label: "Connections", icon: "hub", href: "/connections" },
    { label: "Settings", icon: "tune", href: "/settings", separatorBefore: true },
    ...(installed ? [] : [{ label: "Install app", hint: "Add DOOMBOT as a shortcut", icon: "install_mobile", onSelect: () => void installApp() }]),
    { label: "Sign out", icon: "logout", separatorBefore: true, onSelect: () => void signOut() },
  ];

  const attention = pendingCount + unreadCount > 0;

  return (
    <div className="border-t border-line pt-3">
      <Menu
        label="Account menu"
        direction="up"
        align="start"
        width="w-72"
        items={items}
        header={<p className="truncate px-3 pt-2 pb-2 text-sm text-muted">{account.email}</p>}
        triggerClassName="relative flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-raised"
        trigger={
          <>
            <Avatar account={account} size={36} />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium">{account.name}</span>
              <span className="truncate text-xs text-muted">{account.email}</span>
            </span>
            {attention && <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-danger" />}
            <Icon name="unfold_more" size={18} className="text-muted" />
          </>
        }
      />
    </div>
  );
}
