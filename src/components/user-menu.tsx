"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@/components/icon";
import { Menu, type MenuItem } from "@/components/menu";
import type { Account } from "@/components/use-nav-data";

export function UserMenu({ account }: { account: Account | null }) {
  const router = useRouter();

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  if (!account) {
    return null;
  }

  const items: MenuItem[] = [
    { label: "Settings", hint: "Time zone, instructions and memory", icon: "tune", href: "/settings" },
    { label: "Export my data", hint: "Download everything as a file", icon: "download", href: "/api/account/export", download: true },
    { label: "Delete my data", hint: "Erase your account data", icon: "delete_forever", href: "/settings#delete-data", danger: true },
    { label: "Privacy", icon: "shield", href: "/privacy" },
    { label: "Terms", icon: "description", href: "/terms" },
    { label: "Sign out", icon: "logout", onSelect: () => void signOut() },
  ];

  return (
    <div className="border-t border-line pt-3">
      <Menu
        label="Account menu"
        direction="up"
        align="start"
        width="w-72"
        items={items}
        triggerClassName="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-raised"
        trigger={
          <>
            <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-raised text-sm font-semibold text-doom">
              {account.name.charAt(0).toUpperCase()}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium">{account.name}</span>
              <span className="truncate text-xs text-muted">{account.email}</span>
            </span>
            <Icon name="unfold_more" size={18} className="text-muted" />
          </>
        }
      />
    </div>
  );
}
