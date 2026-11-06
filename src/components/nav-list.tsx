"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/icon";

const links = [
  { href: "/", label: "Chat", icon: "forum" },
  { href: "/bots", label: "Doombots", icon: "smart_toy" },
  { href: "/alerts", label: "Alerts", icon: "notifications" },
  { href: "/briefing", label: "Briefing", icon: "wb_twilight" },
  { href: "/todos", label: "To-do", icon: "task_alt" },
  { href: "/approvals", label: "Approvals", icon: "verified_user" },
  { href: "/connections", label: "Connections", icon: "hub" },
  { href: "/settings", label: "Settings", icon: "tune" },
];

interface NavListProps {
  pendingCount: number;
  unreadCount: number;
  roomy?: boolean;
  onNavigate?: () => void;
}

export function NavList({ pendingCount, unreadCount, roomy = false, onNavigate }: NavListProps) {
  const pathname = usePathname();

  return (
    <ul className="flex flex-col gap-1">
      {links.map((link) => {
        const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        const badge =
          link.href === "/approvals" && pendingCount > 0
            ? { count: pendingCount, tone: "bg-doom" }
            : link.href === "/alerts" && unreadCount > 0
              ? { count: unreadCount, tone: "bg-danger" }
              : null;
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`flex items-center justify-between gap-3 rounded-xl px-3 transition-colors ${
                roomy ? "py-3 text-base" : "py-2 text-sm"
              } ${active ? "bg-raised font-medium text-ink" : "text-muted hover:bg-raised hover:text-ink"}`}
            >
              <span className="flex items-center gap-3">
                <Icon name={link.icon} className={`${roomy ? "text-[22px]" : "text-[20px]"} ${active ? "text-doom" : ""}`} />
                {link.label}
              </span>
              {badge && (
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold text-canvas ${badge.tone}`}>
                  {badge.count}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
