import { Icon } from "@/components/icon";

export function FeatureBadge({ icon, size = 40 }: { icon: string; size?: number }) {
  return (
    <span className="doom-hex flex shrink-0 items-center justify-center bg-doom-soft text-doom" style={{ width: size, height: size }}>
      <Icon name={icon} size={Math.round(size * 0.5)} />
    </span>
  );
}
