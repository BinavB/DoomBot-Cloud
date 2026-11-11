"use client";

import { useEffect, useId, useRef, useState } from "react";
import { BriefingTopicsPicker, saveBriefingTopics } from "@/components/briefing-topics-picker";
import { InstallButton } from "@/components/install-button";
import { defaultTopics, type TopicId } from "@/lib/briefing/topics";
import { features, welcomeFeatures, type FeatureId } from "@/lib/tour/features";
import { FeatureBadge } from "./feature-badge";
import { GoogleAction } from "./google-action";
import { LearnMoreButton } from "./learn-more-button";
import { LearnMoreDialog } from "./learn-more-dialog";
import { useDecodeText } from "./use-decode-text";
import { useEscape } from "./use-escape";
import { WelcomeSigil } from "./welcome-sigil";

interface WelcomeDialogProps {
  guest: boolean;
  onChoose: (wantsTour: boolean) => void;
}

const featureDelayMilliseconds = 900;
const featureStaggerMilliseconds = 70;

export function WelcomeDialog({ guest, onChoose }: WelcomeDialogProps) {
  const titleId = useId();
  const startRef = useRef<HTMLButtonElement>(null);
  const [learning, setLearning] = useState<FeatureId | null>(null);
  const [topics, setTopics] = useState<TopicId[]>(defaultTopics);
  const title = useDecodeText("Doom awaits your command");
  function choose(wantsTour: boolean) {
    void saveBriefingTopics(topics);
    onChoose(wantsTour);
  }

  useEscape(() => choose(false), learning === null);

  useEffect(() => {
    startRef.current?.focus({ preventScroll: true });
  }, []);

  const google = features.google;

  return (
    <div className="doom-war-room fixed inset-0 z-[70] overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 sm:p-8">
        <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="doom-plate doom-rise w-full max-w-2xl">
          <div className="doom-plate-inner overflow-hidden">
            <span aria-hidden className="doom-visor pointer-events-none absolute inset-x-0 h-px bg-doom shadow-[0_0_18px_4px_rgba(63,158,104,0.55)]" />
            <div className="flex flex-col items-center gap-3 px-6 pt-8 text-center sm:px-10">
              <WelcomeSigil />
              <h2 id={titleId} aria-label="Doom awaits your command" className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                <span aria-hidden>{title}</span>
              </h2>
              <p className="max-w-md text-sm leading-relaxed text-muted">
                DOOMBOT is your own AI that thinks ahead. It chats, remembers, and runs small jobs for you.
              </p>
            </div>

            <ul className="mt-6 grid gap-px border-y border-line bg-line/60 sm:grid-cols-2">
              {welcomeFeatures.map((id, index) => {
                const feature = features[id];
                return (
                  <li
                    key={id}
                    className="doom-rise flex items-start gap-3 bg-panel px-6 py-4"
                    style={{ animationDelay: `${featureDelayMilliseconds + index * featureStaggerMilliseconds}ms` }}
                  >
                    <FeatureBadge icon={feature.icon} size={36} />
                    <div className="flex min-w-0 flex-col gap-1">
                      <p className="text-sm font-semibold">{feature.name}</p>
                      <p className="text-sm text-muted">{feature.short}</p>
                      <LearnMoreButton label={feature.name} onClick={() => setLearning(id)} />
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="doom-rise mx-6 mt-6 flex flex-col gap-3" style={{ animationDelay: `${featureDelayMilliseconds + welcomeFeatures.length * featureStaggerMilliseconds}ms` }}>
              <p className="text-sm font-semibold">What should your morning briefing cover?</p>
              <BriefingTopicsPicker selected={topics} onChange={setTopics} />
            </div>

            <div
              className="doom-rise mx-6 mt-6 flex flex-col gap-3 border-l-2 border-signal bg-raised/60 px-5 py-4 sm:mx-10 sm:flex-row sm:items-center"
              style={{ animationDelay: `${featureDelayMilliseconds + welcomeFeatures.length * featureStaggerMilliseconds}ms` }}
            >
              <FeatureBadge icon={google.icon} size={40} />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="text-sm font-semibold">Connect Google for the proactive features</p>
                <p className="text-sm text-muted">
                  {guest
                    ? "You are using DOOMBOT as a guest. Sign in with Google to keep your chats and let DOOMBOT watch your Gmail and Calendar."
                    : "Let DOOMBOT read your Gmail and Calendar so it can warn you first."}
                </p>
                <LearnMoreButton label={google.name} onClick={() => setLearning("google")} />
              </div>
              <GoogleAction guest={guest} />
            </div>

            <div
              className="doom-rise mx-6 mt-4 flex flex-col gap-3 border-l-2 border-doom bg-raised/60 px-5 py-4 sm:mx-10 sm:flex-row sm:items-center"
              style={{ animationDelay: `${featureDelayMilliseconds + welcomeFeatures.length * featureStaggerMilliseconds}ms` }}
            >
              <FeatureBadge icon="install_mobile" size={40} />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="text-sm font-semibold">Install DOOMBOT as an app</p>
                <p className="text-sm text-muted">Add it to your home screen or app drawer so it opens full screen, with no browser bar.</p>
              </div>
              <InstallButton variant="action" />
            </div>

            <div className="flex flex-col items-center gap-4 px-6 py-8 text-center sm:px-10">
              <p className="text-sm">Want a quick tour? It takes about a minute.</p>
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  ref={startRef}
                  type="button"
                  onClick={() => choose(true)}
                  className="doom-pulse h-11 rounded-xl bg-doom px-6 text-sm font-semibold text-canvas"
                >
                  Show me around
                </button>
                <button
                  type="button"
                  onClick={() => choose(false)}
                  className="h-11 rounded-xl border border-line px-6 text-sm font-medium hover:bg-raised"
                >
                  No thanks
                </button>
              </div>
              <p className="text-xs text-muted">You can replay the tour from your profile menu.</p>
            </div>
          </div>
        </div>
      </div>
      {learning && <LearnMoreDialog feature={features[learning]} onClose={() => setLearning(null)} />}
    </div>
  );
}
