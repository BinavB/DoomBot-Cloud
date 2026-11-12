import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { SettingsView } from "@/app/settings/_components/settings-view";

export const metadata: Metadata = {
  title: "Settings",
  description: "Your custom instructions and what DOOMBOT remembers about you",
};

export default function SettingsPage() {
  return (
    <AppShell title="Settings">
      <SettingsView />
    </AppShell>
  );
}
