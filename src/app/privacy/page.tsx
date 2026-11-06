import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How DOOMBOT handles your data",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy">
      <p>DOOMBOT stores your chats, Doombots, memories, to-dos, alerts and Google connection in a private database, and only shows them to your signed-in account.</p>
      <p>When you sign in with Google, we store your name, email address and profile picture. We never read your Google data unless you connect Calendar, Gmail or Tasks, and then we only read it to answer your requests.</p>
      <p>Your messages are sent to the AI providers you have configured (Google Gemini and DeepSeek) to produce answers. Those providers have their own privacy policies.</p>
      <p>You can sign out at any time, and you can disconnect Google from the Connections page. Questions about your data go to the app owner.</p>
    </LegalPage>
  );
}
