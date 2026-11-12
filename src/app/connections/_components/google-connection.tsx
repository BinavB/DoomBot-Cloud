interface GoogleConnectionProps {
  connected: boolean | null;
  alertsOn: boolean | null;
  onToggleAlerts: () => void;
  onDisconnect: () => void;
}

export function GoogleConnection({ connected, alertsOn, onToggleAlerts, onDisconnect }: GoogleConnectionProps) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-line bg-panel p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-lg font-semibold">Google</h2>
        {connected !== null && (
          <span className={`text-sm ${connected ? "text-doom" : "text-muted"}`}>
            {connected ? "Connected" : "Not connected"}
          </span>
        )}
      </div>
      <p className="leading-relaxed text-muted">
        DOOMBOT reads your calendar, unread email, Google Tasks and Drive files. It can send an email, and it asks you first unless you choose Always allow in Settings. It never deletes or changes your files.
      </p>
      {connected && (
        <button
          type="button"
          role="switch"
          aria-checked={alertsOn === true}
          onClick={onToggleAlerts}
          disabled={alertsOn === null}
          className="flex w-fit items-center gap-3 rounded-xl border border-line px-4 py-2.5 text-sm hover:bg-raised"
        >
          <span>Alert me when new email arrives</span>
          <span className={`font-semibold ${alertsOn ? "text-doom" : "text-muted"}`}>{alertsOn ? "On" : "Off"}</span>
        </button>
      )}
      <div className="flex flex-wrap gap-2">
        <a href="/api/google/connect" className="rounded-xl bg-doom px-4 py-2.5 text-sm font-semibold text-canvas">
          {connected ? "Reconnect Google" : "Connect Google"}
        </a>
        {connected && (
          <button
            type="button"
            onClick={onDisconnect}
            className="rounded-xl border border-line px-4 py-2.5 text-sm font-medium hover:bg-raised"
          >
            Disconnect
          </button>
        )}
      </div>
    </section>
  );
}
