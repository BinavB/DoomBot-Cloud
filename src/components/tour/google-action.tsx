import { Icon } from "@/components/icon";

export function GoogleAction({ guest }: { guest: boolean }) {
  return (
    <a
      href={guest ? "/api/auth/google/start" : "/api/google/connect"}
      className="flex h-10 w-fit items-center gap-2 rounded-xl border border-doom/60 bg-doom-soft px-4 text-sm font-semibold text-ink hover:border-doom"
    >
      <Icon name={guest ? "login" : "hub"} size={18} className="text-doom" />
      {guest ? "Sign in with Google" : "Connect Google"}
    </a>
  );
}
