"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { features, type FeatureId } from "@/lib/tour/features";
import { placeCard, type Box, type Size } from "@/lib/tour/placement";
import type { TourStep } from "@/lib/tour/tours";
import { findTargetBox } from "./find-target";
import { GoogleAction } from "./google-action";
import { InstallButton } from "@/components/install-button";
import { LearnMoreButton } from "./learn-more-button";
import { LearnMoreDialog } from "./learn-more-dialog";
import { useEscape } from "./use-escape";

interface TourOverlayProps {
  steps: TourStep[];
  guest: boolean;
  onDone: (hideNextTime: boolean) => void;
  onSkipAll: () => void;
}

const fallbackCardHeight = 240;
const bracketClass = "doom-lock absolute h-4 w-4 border-doom";

export function TourOverlay({ steps, guest, onDone, onSkipAll }: TourOverlayProps) {
  const titleId = useId();
  const cardRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const [index, setIndex] = useState(0);
  const [hideNextTime, setHideNextTime] = useState(true);
  const [learning, setLearning] = useState<FeatureId | null>(null);
  const [box, setBox] = useState<Box | null>(null);
  const [viewport, setViewport] = useState<Size>({ width: 0, height: 0 });
  const [cardHeight, setCardHeight] = useState(fallbackCardHeight);
  const [moved, setMoved] = useState(false);
  const step = steps[index];
  const last = index === steps.length - 1;

  const measure = useCallback(() => {
    setViewport({ width: window.innerWidth, height: window.innerHeight });
    setBox(findTargetBox(step.targets));
  }, [step]);

  useEffect(() => {
    let frame = requestAnimationFrame(measure);
    function schedule() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    }
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, true);
    };
  }, [measure]);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) {
      return;
    }
    const observer = new ResizeObserver(([entry]) => setCardHeight(entry.borderBoxSize[0]?.blockSize ?? entry.contentRect.height));
    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    nextRef.current?.focus({ preventScroll: true });
  }, [index]);

  const goNext = useCallback(() => {
    if (last) {
      onDone(hideNextTime);
    } else {
      setMoved(true);
      setIndex((current) => current + 1);
    }
  }, [last, onDone, hideNextTime]);

  const goBack = useCallback(() => {
    setMoved(true);
    setIndex((current) => Math.max(0, current - 1));
  }, []);

  useEscape(() => onDone(false), learning === null);

  useEffect(() => {
    if (learning !== null) {
      return;
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "ArrowRight") {
        goNext();
      } else if (event.key === "ArrowLeft") {
        goBack();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goBack, learning]);

  const ready = viewport.width > 0;
  const placement = placeCard(box, cardHeight, viewport);
  const hole = box ?? { top: viewport.height / 2, left: viewport.width / 2, width: 0, height: 0 };
  const feature = step.feature ? features[step.feature] : null;

  return (
    <div className="fixed inset-0 z-[70]" style={{ visibility: ready ? "visible" : "hidden" }}>
      <div
        aria-hidden
        className="absolute rounded-2xl transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none"
        style={{ ...hole, boxShadow: "0 0 0 200vmax rgba(5, 8, 7, 0.78)" }}
      >
        {box && (
          <div key={step.id} className="absolute inset-0">
            <span className={`${bracketClass} -top-1 -left-1 border-t-2 border-l-2`} />
            <span className={`${bracketClass} -top-1 -right-1 border-t-2 border-r-2`} />
            <span className={`${bracketClass} -bottom-1 -left-1 border-b-2 border-l-2`} />
            <span className={`${bracketClass} -right-1 -bottom-1 border-r-2 border-b-2`} />
            <div className="absolute inset-0 overflow-hidden rounded-2xl">
              <span className="doom-scan absolute inset-0 bg-gradient-to-b from-transparent via-doom/25 to-transparent" />
            </div>
          </div>
        )}
      </div>

      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`doom-plate absolute ${moved ? "transition-[top,left] duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none" : ""}`}
        style={{ top: placement.top, left: placement.left, width: placement.width }}
      >
        <div key={step.id} className="doom-plate-inner doom-rise flex flex-col gap-3 p-5">
          <div className="flex items-center gap-3">
            <div className="flex flex-1 gap-1" aria-hidden>
              {steps.map((item, position) => (
                <span key={item.id} className="h-1 flex-1 overflow-hidden bg-line">
                  <span className={`doom-cell block h-full bg-doom ${position <= index ? "scale-x-100" : "scale-x-0"}`} />
                </span>
              ))}
            </div>
            <span className="shrink-0 text-xs text-muted">
              {index + 1} of {steps.length}
            </span>
          </div>
          <h2 id={titleId} className="font-display text-lg leading-snug font-semibold">
            {step.title}
          </h2>
          <p className="text-sm leading-relaxed text-muted">{step.body}</p>
          {feature && <LearnMoreButton label={feature.name} onClick={() => setLearning(feature.id)} />}
          {step.google && <GoogleAction guest={guest} />}
          {step.install && <InstallButton variant="action" />}
          {last && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={hideNextTime}
                onChange={(event) => setHideNextTime(event.target.checked)}
                className="h-4 w-4 accent-[var(--doom)]"
              />
              Don&apos;t show this again
            </label>
          )}
          <div className="mt-1 flex items-center justify-between gap-2">
            <button type="button" onClick={onSkipAll} className="rounded-lg px-2 py-2 text-sm text-muted hover:text-ink">
              Skip all
            </button>
            <div className="flex gap-2">
              {index > 0 && (
                <button type="button" onClick={goBack} className="h-9 rounded-xl border border-line px-4 text-sm font-medium hover:bg-raised">
                  Back
                </button>
              )}
              <button ref={nextRef} type="button" onClick={goNext} className="h-9 rounded-xl bg-doom px-4 text-sm font-semibold text-canvas">
                {last ? "Finish" : "Next"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {learning && <LearnMoreDialog feature={features[learning]} onClose={() => setLearning(null)} />}
    </div>
  );
}
