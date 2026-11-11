"use client";

import { announceStatus, startStatus, type StatusHandle } from "@/components/status-store";

interface InstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const installTimeoutMilliseconds = 20000;

let deferred: InstallEvent | null = null;
let installing: StatusHandle | null = null;
let installedEventSeen = false;
let installTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

function finishInstalling(label: string): void {
  if (installTimer) {
    clearTimeout(installTimer);
    installTimer = null;
  }
  installing?.done(label);
  installing = null;
}

function beginInstalling(): void {
  installing = startStatus("Installing DOOMBOT");
  installTimer = setTimeout(() => finishInstalling("Check your app list"), installTimeoutMilliseconds);
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferred = event as InstallEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    installedEventSeen = true;
    finishInstalling("App installed");
    notify();
  });
}

export function subscribeInstall(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function canPromptInstall(): boolean {
  return deferred !== null;
}

export function isInstalled(): boolean {
  const standalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return standalone || window.matchMedia("(display-mode: standalone)").matches;
}

export function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export async function promptInstall(): Promise<boolean> {
  if (!deferred) {
    return false;
  }
  const event = deferred;
  deferred = null;
  notify();
  await event.prompt();
  return (await event.userChoice).outcome === "accepted";
}

export async function installApp(): Promise<void> {
  if (canPromptInstall()) {
    installedEventSeen = false;
    if (await promptInstall()) {
      if (installedEventSeen) {
        announceStatus("App installed");
      } else {
        beginInstalling();
      }
    }
    return;
  }
  const hint = isIos() ? "Tap Share, then Add to Home Screen" : "Open your browser menu, then Install app";
  announceStatus(hint, "done", 7000);
}
