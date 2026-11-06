import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Terms",
  description: "Terms for using DOOMBOT",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms">
      <p>DOOMBOT is provided as is, without warranty. AI answers can be wrong, so check anything important before you act on it.</p>
      <p>Actions that change things, such as deleting a Doombot or a task, wait for your approval. You are responsible for the actions you approve.</p>
      <p>Use DOOMBOT lawfully and do not try to access other people&apos;s accounts or data. The app owner may limit or end access at any time.</p>
    </LegalPage>
  );
}
