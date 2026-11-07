import { DoomMark } from "@/components/doom-mark";

export function WelcomeSigil() {
  return (
    <div className="relative flex h-40 w-40 items-center justify-center">
      <span aria-hidden className="doom-flare absolute inset-4 rounded-full border-2 border-doom" />
      <svg viewBox="0 0 160 160" aria-hidden="true" className="absolute inset-0 h-full w-full">
        <g className="doom-spin">
          <circle cx="80" cy="80" r="76" fill="none" stroke="var(--steel)" strokeOpacity="0.35" strokeWidth="1" strokeDasharray="1 9" />
        </g>
        <circle cx="80" cy="80" r="64" fill="none" stroke="var(--line)" strokeWidth="1" />
        <circle
          className="doom-draw"
          cx="80"
          cy="80"
          r="64"
          fill="none"
          stroke="var(--doom)"
          strokeWidth="2"
          strokeLinecap="round"
          transform="rotate(-90 80 80)"
        />
        <circle cx="80" cy="16" r="2.5" fill="var(--signal)" />
        <circle cx="80" cy="144" r="2.5" fill="var(--signal)" />
      </svg>
      <DoomMark size={84} />
    </div>
  );
}
