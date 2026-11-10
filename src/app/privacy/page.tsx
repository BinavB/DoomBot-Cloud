import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How DOOMBOT handles your data",
};

const policyLinkClass = "text-doom underline underline-offset-2";

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy">
      <p>DOOMBOT stores your chats, Doombots, memories, to-dos, alerts and Google connection in a private database, and only shows them to your signed-in account.</p>
      <p>When you sign in with Google, we store your name, email address and profile picture. We never read your Google data unless you connect Calendar, Gmail or Tasks, and then we only read it to answer your requests.</p>
      <p>Your messages are sent to the AI providers you have configured (Google Gemini and DeepSeek) to produce answers. Those providers have their own privacy policies.</p>
      <p>You can sign out at any time, and you can disconnect Google from the Connections page. Questions about your data go to the app owner.</p>

      <h2 className="pt-2 font-display text-lg font-semibold text-ink">Google user data</h2>
      <p>If you choose to connect your Google account, DOOMBOT asks for read-only access to your Google Calendar, Gmail and Google Tasks. It cannot send, change or delete anything in those services.</p>
      <p>We use this data only to provide the features you see in DOOMBOT: answering your questions about your day, building your morning briefing, and alerting you to events and email that need attention.</p>
      <p>We do not sell your Google data, share it with advertisers or data brokers, or use it for advertising. We do not use it to train AI models. Our team does not read your Google data, except where you ask us for help, where it is needed for security, or where the law requires it.</p>
      <p>When you ask a question, the relevant pieces of your calendar, email subjects or tasks are sent to the AI providers listed above so they can write the answer. They are not sent for any other purpose. Answers and briefings that include this information are saved in your private account, and your Google access token is stored encrypted.</p>
      <p>You can disconnect Google at any time from the Connections page, and you can remove your Google access from your Google Account permissions page. Deleting your DOOMBOT account from Settings removes your saved chats, briefings and connection data.</p>
      <p>
        DOOMBOT&apos;s use and transfer of information received from Google APIs follows the{" "}
        <a href="https://developers.google.com/terms/api-services-user-data-policy" className={policyLinkClass} target="_blank" rel="noopener noreferrer">
          Google API Services User Data Policy
        </a>
        , including the Limited Use requirements.
      </p>
    </LegalPage>
  );
}
