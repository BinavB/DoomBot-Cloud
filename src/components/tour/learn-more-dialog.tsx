"use client";

import { useEffect, useId, useRef } from "react";
import type { Feature } from "@/lib/tour/features";
import { FeatureBadge } from "./feature-badge";
import { useEscape } from "./use-escape";

interface LearnMoreDialogProps {
  feature: Feature;
  onClose: () => void;
}

export function LearnMoreDialog({ feature, onClose }: LearnMoreDialogProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  useEscape(onClose);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-canvas/75 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="doom-plate doom-rise w-full max-w-md"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="doom-plate-inner flex flex-col gap-5 p-6">
          <div className="flex items-center gap-3">
            <FeatureBadge icon={feature.icon} size={44} />
            <div className="flex flex-col">
              <h2 id={titleId} className="font-display text-lg font-semibold">
                {feature.name}
              </h2>
              <p className="text-sm text-muted">{feature.short}</p>
            </div>
          </div>
          <ul className="flex flex-col gap-3">
            {feature.details.map((detail) => (
              <li key={detail} className="flex gap-3 text-sm leading-relaxed">
                <span aria-hidden className="doom-hex mt-1.5 h-2 w-2 shrink-0 bg-doom" />
                <span>{detail}</span>
              </li>
            ))}
          </ul>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="h-10 w-fit self-end rounded-xl bg-doom px-5 text-sm font-semibold text-canvas"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
