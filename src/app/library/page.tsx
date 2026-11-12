import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { LibraryView } from "@/app/library/_components/library-view";

export const metadata: Metadata = {
  title: "Library",
  description: "Notes and files DOOMBOT saved for you",
};

export default function LibraryPage() {
  return (
    <AppShell title="Library">
      <LibraryView />
    </AppShell>
  );
}
