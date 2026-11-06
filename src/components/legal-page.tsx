import type { ReactNode } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <AppShell title={title} bare>
      <article className="flex w-full max-w-2xl flex-col gap-4 rounded-2xl border border-line bg-panel p-6 leading-relaxed text-muted [&_p]:text-ink">
        <h1 className="font-display text-2xl font-semibold text-ink">{title}</h1>
        {children}
        <Link href="/" className="w-fit text-sm text-doom underline underline-offset-2">Back to DOOMBOT</Link>
      </article>
    </AppShell>
  );
}
