import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isSpeaking, speak, stopSpeaking, subscribeSpeaking } from "@/lib/speech";

class FakeUtterance {
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  lang = "";
  constructor(public text: string) {}
}

describe("read aloud state", () => {
  let spoken: FakeUtterance[];
  const cancel = vi.fn();

  beforeEach(() => {
    spoken = [];
    cancel.mockReset();
    vi.stubGlobal("window", { speechSynthesis: { cancel, speak: (utterance: FakeUtterance) => spoken.push(utterance) } });
    vi.stubGlobal("SpeechSynthesisUtterance", FakeUtterance);
  });

  afterEach(() => {
    stopSpeaking();
    vi.unstubAllGlobals();
  });

  it("reports speaking from the moment reading starts until it ends", () => {
    expect(isSpeaking()).toBe(false);

    speak("Hello there");
    expect(isSpeaking()).toBe(true);

    spoken[0].onend?.();
    expect(isSpeaking()).toBe(false);
  });

  it("stops reading on demand and tells subscribers", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeSpeaking(listener);

    speak("Hello there");
    stopSpeaking();

    expect(isSpeaking()).toBe(false);
    expect(cancel).toHaveBeenCalled();
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
  });

  it("ignores the end event of an older reading once a newer one has started", () => {
    speak("First");
    speak("Second");

    spoken[0].onend?.();

    expect(isSpeaking()).toBe(true);
  });
});
