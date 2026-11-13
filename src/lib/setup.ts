import { configuredProviderNames } from "@/lib/ai";
import { currentUserId } from "@/lib/auth/context";
import { getCheckinSettings } from "@/lib/checkins";
import { queryRow } from "@/lib/database";
import { isGoogleConnected } from "@/lib/google/oauth";
import { getMailWatch } from "@/lib/mail-watch";
import { isNotionConnected } from "@/lib/notion";
import { getHomeLocation } from "@/lib/settings";

export type SetupStatus = "ready" | "needed" | "optional";

export interface SetupItem {
  id: string;
  label: string;
  status: SetupStatus;
  detail: string;
  href: string | null;
}

export function setupStatus(done: boolean, required: boolean): SetupStatus {
  if (done) {
    return "ready";
  }
  return required ? "needed" : "optional";
}

export async function listSetupItems(): Promise<SetupItem[]> {
  const [google, notion, pushRow, location, checkins, mailWatch] = await Promise.all([
    isGoogleConnected(),
    isNotionConnected(),
    queryRow<{ count: number }>("SELECT COUNT(*) AS count FROM push_subscriptions WHERE user_id = ?", [currentUserId()]),
    getHomeLocation(),
    getCheckinSettings(),
    getMailWatch(),
  ]);
  const ai = configuredProviderNames().length > 0;
  const push = (pushRow?.count ?? 0) > 0;
  return [
    {
      id: "ai",
      label: "AI model",
      status: setupStatus(ai, true),
      detail: ai ? "An AI provider is set up on the server." : "The server has no AI key yet. Add one in Render.",
      href: null,
    },
    {
      id: "google",
      label: "Google",
      status: setupStatus(google, true),
      detail: google ? "Calendar, mail, Tasks and Drive are connected." : "Connect Google for your calendar, mail and briefing.",
      href: google ? null : "/connections",
    },
    {
      id: "push",
      label: "Phone alerts",
      status: setupStatus(push, false),
      detail: push ? "This account gets alerts on at least one device." : "Turn on alerts to hear about check-ins and new mail.",
      href: push ? null : "/alerts",
    },
    {
      id: "city",
      label: "Home city",
      status: setupStatus(location !== null, false),
      detail: location ? `Weather uses ${location.city}.` : "Set a home city below for local weather.",
      href: null,
    },
    {
      id: "notion",
      label: "Notion",
      status: setupStatus(notion, false),
      detail: notion ? "Shared Notion pages can be read." : "Connect Notion to let DOOMBOT read your pages.",
      href: notion ? null : "/connections",
    },
    {
      id: "checkins",
      label: "Check-ins",
      status: setupStatus(checkins.enabled, false),
      detail: checkins.enabled ? `On at ${checkins.times.join(", ")}.` : "Turn on check-ins below to hear from DOOMBOT during the day.",
      href: null,
    },
    {
      id: "mail",
      label: "Email alerts",
      status: setupStatus(mailWatch.enabled, false),
      detail: mailWatch.enabled ? "New email creates an alert." : "Turn on email alerts on the Connections page.",
      href: mailWatch.enabled ? null : "/connections",
    },
  ];
}
