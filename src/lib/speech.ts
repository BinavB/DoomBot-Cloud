export interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> & { length: number }; resultIndex: number }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

let currentUtterance: SpeechSynthesisUtterance | null = null;
let speaking = false;
const speakingListeners = new Set<() => void>();

function setSpeaking(next: boolean): void {
  if (speaking === next) {
    return;
  }
  speaking = next;
  speakingListeners.forEach((listener) => listener());
}

export function speechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  const scope = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null;
}

export function canSpeak(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function subscribeSpeaking(listener: () => void): () => void {
  speakingListeners.add(listener);
  return () => speakingListeners.delete(listener);
}

export function isSpeaking(): boolean {
  return speaking;
}

export function speak(text: string): void {
  if (!canSpeak()) {
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text.replace(/[*_`#>-]/g, " ").slice(0, 4000));
  utterance.lang = "en-GB";
  const finish = () => {
    if (currentUtterance === utterance) {
      currentUtterance = null;
      setSpeaking(false);
    }
  };
  utterance.onend = finish;
  utterance.onerror = finish;
  currentUtterance = utterance;
  setSpeaking(true);
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  currentUtterance = null;
  setSpeaking(false);
  if (canSpeak()) {
    window.speechSynthesis.cancel();
  }
}
