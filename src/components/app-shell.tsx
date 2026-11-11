import type { ReactNode } from "react";
import { InstallButton } from "@/components/install-button";
import { SidebarNav } from "@/components/sidebar-nav";
import { pageNoticesId } from "@/components/page-notice";
import { StatusPill } from "@/components/status-pill";

interface AppShellProps {
  title: string;
  children: ReactNode;
  bare?: boolean;
  actions?: ReactNode;
  mobileActions?: ReactNode;
}

export function AppShell({ title, children, bare = false, actions, mobileActions }: AppShellProps) {
  if (bare) {
    return <main className="flex min-h-dvh items-center justify-center px-4 py-10">{children}</main>;
  }
  return (
    <div className="fixed inset-x-0 top-[var(--app-top,0px)] flex h-[var(--app-height,100dvh)] flex-col overflow-hidden md:flex-row">
      <SidebarNav title={title} actions={mobileActions} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="hidden h-14 shrink-0 items-center justify-between gap-4 border-b border-line px-8 md:flex">
          <h1 className="font-display text-base font-semibold">{title}</h1>
          <div className="flex items-center gap-3">
            <InstallButton />
            {actions}
          </div>
        </header>
        <div id={pageNoticesId} className="flex shrink-0 flex-col items-center gap-2 px-4 pt-3 empty:hidden">
          <StatusPill />
        </div>
        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</main>
      </div>
    </div>
  );
}
