import type { MenuItem } from "@/components/menu";

export function pageLinks(pendingCount: number, unreadCount: number): MenuItem[] {
  return [
    { label: "Doombots", icon: "smart_toy", href: "/bots" },
    { label: "Alerts", icon: "notifications", href: "/alerts", badge: unreadCount },
    { label: "Briefing", icon: "wb_twilight", href: "/briefing" },
    { label: "To-do", icon: "task_alt", href: "/todos" },
    { label: "Library", icon: "library_books", href: "/library" },
    { label: "Approvals", icon: "verified_user", href: "/approvals", badge: pendingCount },
    { label: "Connections", icon: "hub", href: "/connections" },
  ];
}
