"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@/components/icon";
import type { Account } from "@/components/use-nav-data";

export function UserMenu({ account }: { account: Account | null }) {
  const router = useRouter();

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  async function deleteEverything() {
    if (window.prompt("This permanently deletes all your DOOMBOT data. Type DELETE to confirm.") !== "DELETE") {
      return;
    }
    const response = await fetch("/api/account/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: "DELETE" }),
    });
    if (response.ok) {
      router.replace("/login");
    }
  }

  if (!account) {
    return null;
  }

  return (
    <div className="flex items-center gap-3 border-t border-line pt-4">
      <span
        aria-hidden
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-raised text-sm font-semibold text-doom"
      >
        {account.name.charAt(0).toUpperCase()}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium">{account.name}</span>
        <span className="truncate text-xs text-muted">{account.email}</span>
      </span>
      <a href="/api/account/export" aria-label="Export my data" title="Export my data" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-raised hover:text-ink">
        <Icon name="download" size={20} />
      </a>
      <button
        type="button"
        onClick={() => void deleteEverything()}
        aria-label="Delete my data"
        title="Delete my data"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-raised hover:text-danger"
      >
        <Icon name="delete_forever" size={20} />
      </button>
      <button
        type="button"
        onClick={() => void signOut()}
        aria-label="Sign out"
        title="Sign out"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-raised hover:text-danger"
      >
        <Icon name="logout" size={20} />
      </button>
    </div>
  );
}
