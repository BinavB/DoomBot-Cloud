"use client";

import { useEffect, useState } from "react";

const leaveAfterMs = 900;
const removeAfterMs = 1450;

export function LaunchScreen() {
  const [leaving, setLeaving] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const leave = setTimeout(() => setLeaving(true), leaveAfterMs);
    const remove = setTimeout(() => setVisible(false), removeAfterMs);
    return () => {
      clearTimeout(leave);
      clearTimeout(remove);
    };
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div aria-hidden="true" className={`launch-screen${leaving ? " launch-screen-leaving" : ""}`}>
      <div className="launch-nebula" />
      <div className="launch-stars" />
      <div className="launch-core-stack">
        <svg viewBox="0 0 120 120" className="launch-emblem">
          <g className="launch-hex">
            <path d="M60 8L104 33V87L60 112L16 87V33Z" fill="#aab4b0" />
            <path d="M60 20L93 39V81L60 100L27 81V39Z" fill="#141b17" />
          </g>
          <g className="launch-core">
            <circle cx="60" cy="60" r="26" fill="#0d1210" stroke="#3f9e68" strokeWidth="3" />
            <circle cx="60" cy="60" r="11" fill="#3f9e68" />
            <circle cx="60" cy="60" r="4" fill="#0d1210" />
          </g>
          <circle cx="60" cy="14" r="3" fill="#cfa84d" />
          <circle cx="60" cy="106" r="3" fill="#cfa84d" />
        </svg>
        <p className="launch-title">DOOMBOT</p>
        <p className="launch-subtitle">Personal AI agent</p>
        <div className="launch-bar">
          <span />
        </div>
      </div>
    </div>
  );
}
