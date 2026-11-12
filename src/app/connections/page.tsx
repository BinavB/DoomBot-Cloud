import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { ConnectionsView } from "@/app/connections/_components/connections-view";

export const metadata: Metadata = {
  title: "Connections",
  description: "Apps DOOMBOT can read",
};

export default function ConnectionsPage() {
  return (
    <AppShell title="Connections">
      <ConnectionsView />
    </AppShell>
  );
}
