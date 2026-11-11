const boldVariation = '"FILL" 0, "wght" 700, "GRAD" 0, "opsz" 24';

export function Icon({ name, className = "", size, bold = false }: { name: string; className?: string; size?: number; bold?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-sharp shrink-0 select-none ${className}`}
      style={{ fontSize: size, fontVariationSettings: bold ? boldVariation : undefined }}
    >
      {name}
    </span>
  );
}
