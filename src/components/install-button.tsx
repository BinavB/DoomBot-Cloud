"use client";

import { useSyncExternalStore } from "react";
import { Icon } from "@/components/icon";
import { installApp, isInstalled, isIos, subscribeInstall } from "@/components/install-prompt";

type InstallVariant = "header" | "icon" | "action";

const variantClasses: Record<InstallVariant, string> = {
  header: "inline-flex h-9 items-center gap-2 rounded-full border border-doom/60 bg-doom-soft px-3.5 text-sm font-medium text-ink hover:border-doom",
  icon: "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-doom transition-colors hover:bg-raised",
  action: "flex h-10 w-fit items-center gap-2 rounded-xl border border-doom/60 bg-doom-soft px-4 text-sm font-semibold text-ink hover:border-doom",
};

function subscribeNever(): () => void {
  return () => undefined;
}

export function InstallButton({ variant = "header" }: { variant?: InstallVariant }) {
  const installed = useSyncExternalStore(subscribeInstall, isInstalled, () => true);
  const ios = useSyncExternalStore(subscribeNever, isIos, () => false);

  if (installed) {
    return null;
  }

  return (
    <div className={variant === "action" ? "flex flex-col gap-2" : "contents"}>
      <button
        type="button"
        data-tour="install-app"
        onClick={() => void installApp()}
        aria-label="Install app"
        className={variantClasses[variant]}
      >
        <Icon name="download" bold size={variant === "icon" ? 22 : 18} className={variant === "action" ? "text-doom" : undefined} />
        {variant !== "icon" && "Install app"}
      </button>
      {variant === "action" && ios && <p className="text-xs text-muted">On iPhone, tap Share, then Add to Home Screen.</p>}
    </div>
  );
}
