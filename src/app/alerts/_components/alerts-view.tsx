"use client";

import { useCallback, useEffect, useState } from "react";
import { PageNotice } from "@/components/page-notice";
import { Icon } from "@/components/icon";
import { Markdown } from "@/components/markdown";
import { urlBase64ToUint8Array } from "@/lib/push-client";

interface AlertItem {
  id: number;
  title: string;
  body: string;
  urgent: boolean;
  read: boolean;
  createdAt: string;
}

type NotificationState = "checking" | "unsupported" | "blocked" | "off" | "on";

const pollMilliseconds = 10000;
const jsonHeaders = { "Content-Type": "application/json" };

const notificationMessages: Record<NotificationState, string> = {
  checking: "Checking notifications",
  unsupported: "This browser cannot show notifications.",
  blocked: "Notifications are blocked. Allow them in this browser's site settings.",
  off: "Notifications are off. Turn them on to get alerts even when this page is closed.",
  on: "Notifications are on.",
};

function pushSupported(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

async function currentSubscription(): Promise<PushSubscription | null> {
  const registration = await navigator.serviceWorker.getRegistration();
  return (await registration?.pushManager.getSubscription()) ?? null;
}

function formatTime(sqliteTime: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(`${sqliteTime.replace(" ", "T")}Z`));
}

export function AlertsView() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notificationState, setNotificationState] = useState<NotificationState>("checking");
  const [busy, setBusy] = useState(false);
  const [confirmingClear, setConfirmingClear] = useState(false);

  const load = useCallback(() => {
    fetch("/api/notifications")
      .then((response) => response.json() as Promise<{ notifications: AlertItem[] }>)
      .then((data) => setAlerts(data.notifications))
      .catch(() => setError("Alerts could not load. Check your connection and reload."));
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, pollMilliseconds);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    let active = true;
    const check: Promise<NotificationState> = !pushSupported()
      ? Promise.resolve("unsupported")
      : Notification.permission === "denied"
        ? Promise.resolve("blocked")
        : currentSubscription().then((subscription) => (subscription ? "on" : "off"));
    check.then((state) => {
      if (active) {
        setNotificationState(state);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  async function removeAlert(id: number) {
    const response = await fetch("/api/notifications", { method: "DELETE", headers: jsonHeaders, body: JSON.stringify({ id }) });
    if (!response.ok) {
      setError("The alert could not be deleted.");
      return;
    }
    setAlerts((current) => current.filter((alert) => alert.id !== id));
  }

  async function clearAll() {
    setConfirmingClear(false);
    const response = await fetch("/api/notifications", { method: "DELETE", headers: jsonHeaders, body: JSON.stringify({ all: true }) });
    if (!response.ok) {
      setError("Alerts could not be cleared.");
      return;
    }
    setAlerts([]);
  }

  async function readAll() {
    await fetch("/api/notifications", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({ action: "read-all" }),
    });
    load();
  }

  async function turnOnNotifications() {
    setBusy(true);
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setNotificationState(permission === "denied" ? "blocked" : "off");
        return;
      }
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const keyResponse = await fetch("/api/push/key");
      const { publicKey } = (await keyResponse.json()) as { publicKey: string };
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const saved = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      });
      if (!saved.ok) {
        throw new Error("The subscription could not be saved.");
      }
      setNotificationState("on");
    } catch {
      setError("Notifications could not be turned on. Check that this browser allows them.");
    } finally {
      setBusy(false);
    }
  }

  async function turnOffNotifications() {
    setBusy(true);
    setError(null);
    try {
      const subscription = await currentSubscription();
      if (subscription) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: jsonHeaders,
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      setNotificationState("off");
    } catch {
      setError("Notifications could not be turned off.");
    } finally {
      setBusy(false);
    }
  }

  const unread = alerts.filter((alert) => !alert.read).length;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-8 md:px-8">
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-panel p-5">
        <p className="max-w-md text-sm text-muted">{notificationMessages[notificationState]}</p>
        <div className="flex flex-wrap gap-2">
          {notificationState === "off" && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void turnOnNotifications()}
              className="flex h-10 items-center gap-2 rounded-xl bg-doom px-4 text-sm font-semibold text-canvas disabled:opacity-40"
            >
              <Icon name="notifications_active" size={18} />
              Turn on notifications
            </button>
          )}
          {notificationState === "on" && (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => void turnOffNotifications()}
                className="h-10 rounded-xl px-4 text-sm text-muted hover:bg-raised hover:text-danger disabled:opacity-40"
              >
                Turn off
              </button>
            </>
          )}
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">{unread === 0 ? "You have read everything." : `${unread} unread`}</p>
        <div className="flex flex-wrap items-center gap-2">
          {unread > 0 && (
            <button
              type="button"
              onClick={() => void readAll()}
              className="h-10 rounded-xl border border-line px-4 text-sm font-medium hover:bg-raised"
            >
              Mark all read
            </button>
          )}
          {alerts.length > 0 &&
            (confirmingClear ? (
              <span className="flex items-center gap-2 text-sm">
                Delete all alerts?
                <button
                  type="button"
                  onClick={() => void clearAll()}
                  className="h-10 rounded-xl bg-danger px-4 text-sm font-semibold text-canvas"
                >
                  Delete all
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingClear(false)}
                  className="h-10 rounded-xl px-3 text-sm text-muted hover:bg-raised hover:text-ink"
                >
                  Cancel
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingClear(true)}
                className="h-10 rounded-xl px-4 text-sm text-muted hover:bg-raised hover:text-danger"
              >
                Clear all
              </button>
            ))}
        </div>
      </div>

      {error && <PageNotice tone="error">{error}</PageNotice>}

      {alerts.length === 0 ? (
        <p className="rounded-2xl border border-line bg-panel p-6 text-sm text-muted">
          No alerts yet. Results from your routines and urgent alerts from your Doombots appear here.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {alerts.map((alert) => (
            <li
              key={alert.id}
              className={`flex flex-col gap-3 rounded-2xl border bg-panel p-5 ${
                alert.urgent ? "border-danger/50" : "border-line"
              }`}
            >
              <div className="flex items-center justify-between gap-2 text-xs text-muted">
                <span className="flex items-center gap-2">
                  {!alert.read && <span aria-label="Unread" className="h-2 w-2 rounded-full bg-doom" />}
                  {alert.urgent && <span className="font-semibold text-danger">Urgent</span>}
                  <span>{formatTime(alert.createdAt)}</span>
                </span>
                <button
                  type="button"
                  onClick={() => void removeAlert(alert.id)}
                  aria-label={`Delete alert: ${alert.title}`}
                  className="-my-1 -mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-raised hover:text-ink"
                >
                  <Icon name="close" size={18} />
                </button>
              </div>
              <p className="font-medium">{alert.title}</p>
              {alert.body && <Markdown text={alert.body} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
