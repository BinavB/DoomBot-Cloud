"use client";

import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { tourKeyFor, tours } from "@/lib/tour/tours";
import { chooseTour, finishTour, skipAllTours, useTourState } from "./tour-store";
import { TourOverlay } from "./tour-overlay";
import { WelcomeDialog } from "./welcome-dialog";

interface TourHostProps {
  ready: boolean;
  guest: boolean;
}

export function TourHost({ ready, guest }: TourHostProps) {
  const pathname = usePathname();
  const state = useTourState();
  if (!ready) {
    return null;
  }
  if (state.choice === "unset") {
    return createPortal(<WelcomeDialog guest={guest} onChoose={chooseTour} />, document.body);
  }
  const key = tourKeyFor(pathname);
  if (state.choice !== "tour" || key === null || state.seen.includes(key) || state.dismissed.includes(key)) {
    return null;
  }
  return createPortal(
    <TourOverlay key={key} steps={tours[key]} guest={guest} onDone={(hide) => finishTour(key, hide)} onSkipAll={skipAllTours} />,
    document.body,
  );
}
