"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/icon";
import { pageLinks } from "@/components/page-links";

interface SidebarPagesProps {
  pendingCount: number;
  unreadCount: number;
  onNavigate?: () => void;
}

export function SidebarPages({ pendingCount, unreadCount, onNavigate }: SidebarPagesProps) {
  const pathname = usePathname();

  return (
    <ul className="flex flex-col gap-0.5" aria-label="Pages">
      {pageLinks(pendingCount, unreadCount).map((page) => {
        const active = pathname === page.href;
        return (
          <li key={page.label}>
            <Link
              href={page.href ?? "/"}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`flex h-10 items-center gap-3 rounded-xl px-3 text-sm hover:bg-raised ${active ? "bg-raised font-medium text-ink" : "text-muted hover:text-ink"}`}
            >
              <Icon name={page.icon ?? "circle"} size={20} />
              <span className="min-w-0 flex-1 truncate">{page.label}</span>
              {page.badge !== undefined && page.badge > 0 && (
                <span className="rounded-full bg-doom px-2 py-0.5 text-xs font-semibold text-canvas">{page.badge}</span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
