"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { DoomMark } from "@/components/doom-mark";
import { FloatingNotice } from "@/components/floating-notice";
import { GoogleLogo } from "@/components/google-logo";
import { Icon } from "@/components/icon";

function subscribeToLocation(onChange: () => void): () => void {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
}

function readError(): string | null {
  return new URLSearchParams(window.location.search).get("error");
}

const errorMessages: Record<string, string> = {
  setup: "Sign-in is not available right now. Try again later.",
  denied: "Google sign-in was cancelled. Try again when you are ready.",
  expired: "The sign-in took too long or was interrupted. Try again.",
  failed: "Google could not confirm your account. Try again, or use another account.",
  "guests-full": "Too many guests joined in the last hour. Sign in with Google, or try again later.",
  "guest-google": "Sign in with Google first. Then you can connect Gmail and Calendar.",
};

const trustPoints = [
  { icon: "lock", text: "Your chats stay private to your account" },
  { icon: "visibility", text: "Google access is read-only, and only if you connect it" },
  { icon: "block", text: "No ads, and your data is never sold" },
];

export function LoginCard() {
  const error = useSyncExternalStore(subscribeToLocation, readError, () => null);
  const message = error ? errorMessages[error] : undefined;

  return (
    <section className="flex w-full max-w-sm flex-col items-center gap-6 rounded-2xl border border-line bg-panel p-8 text-center">
      <DoomMark size={64} />
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-2xl font-semibold tracking-tight">DOOMBOT</h1>
        <p className="text-sm leading-relaxed text-muted">
          Sign in with Google. Your chats, Doombots and memories stay private to your account.
        </p>
      </div>
      {message && <FloatingNotice tone="error">{message}</FloatingNotice>}
      <a
        href="/api/auth/google/start"
        className="flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white px-4 text-sm font-semibold text-[#1f1f1f] transition-colors hover:bg-[#f1f3f4]"
      >
        <GoogleLogo />
        Continue with Google
      </a>
      <form method="post" action="/api/auth/guest" className="flex w-full flex-col items-center gap-2">
        <button type="submit" className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-line px-4 text-sm font-medium hover:bg-raised">
          <Icon name="person" size={18} />
          Skip sign-in, try as a guest
        </button>
        <p className="text-xs leading-relaxed text-muted">
          Guests get a few messages a day. Connect Google later for the proactive features and to keep your chats.
        </p>
      </form>
      <ul className="flex w-full flex-col gap-2 border-t border-line pt-5 text-left text-xs text-muted">
        {trustPoints.map((point) => (
          <li key={point.text} className="flex items-center gap-2.5">
            <Icon name={point.icon} size={16} className="text-doom" />
            {point.text}
          </li>
        ))}
      </ul>
      <p className="text-xs leading-relaxed text-muted">
        By continuing you agree to the{" "}
        <Link href="/terms" className="underline underline-offset-2 hover:text-ink">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-ink">
          Privacy Policy
        </Link>
        .
      </p>
    </section>
  );
}
