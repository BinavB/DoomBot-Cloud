"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Icon } from "@/components/icon";
import { announceStatus, startStatus, type StatusHandle } from "@/components/status-store";
import { speechRecognitionConstructor, type SpeechRecognitionLike } from "@/lib/speech";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
}

export function VoiceInput({ onTranscript }: VoiceInputProps) {
  const supported = useSyncExternalStore(
    () => () => undefined,
    () => speechRecognitionConstructor() !== null,
    () => false,
  );
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const statusRef = useRef<StatusHandle | null>(null);
  const heardRef = useRef(false);
  const transcriptRef = useRef(onTranscript);

  useEffect(() => {
    transcriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    return () => recognitionRef.current?.stop();
  }, []);

  function toggle() {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const Recognition = speechRecognitionConstructor();
    if (!Recognition) {
      return;
    }
    const recognition = new Recognition();
    recognition.lang = "en-GB";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const text = Array.from({ length: event.results.length }, (_, index) => event.results[index][0].transcript)
        .join(" ")
        .trim();
      if (text) {
        heardRef.current = true;
        transcriptRef.current(text);
        statusRef.current?.done("Voice added to your message");
      }
    };
    recognition.onend = () => {
      setListening(false);
      if (!heardRef.current) {
        statusRef.current?.done("Stopped listening");
      }
    };
    recognition.onerror = () => {
      setListening(false);
      announceStatus("Couldn't hear you. Try again", "error");
    };
    recognitionRef.current = recognition;
    setListening(true);
    heardRef.current = false;
    statusRef.current = startStatus("Listening");
    recognition.start();
  }

  if (!supported) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={listening ? "Stop listening" : "Speak your message"}
      aria-pressed={listening}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
        listening ? "bg-danger text-canvas" : "text-muted hover:bg-raised hover:text-ink"
      }`}
    >
      <Icon name="mic" size={22} />
    </button>
  );
}
