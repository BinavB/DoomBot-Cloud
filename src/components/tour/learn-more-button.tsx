export function LearnMoreButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Learn more about ${label}`}
      className="w-fit text-xs font-semibold text-doom underline-offset-4 hover:underline"
    >
      Learn more
    </button>
  );
}
