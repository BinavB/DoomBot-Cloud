interface NotionConnectionProps {
  connected: boolean | null;
  available: boolean;
  onDisconnect: () => void;
}

export function NotionConnection({ connected, available, onDisconnect }: NotionConnectionProps) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-line bg-panel p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-lg font-semibold">Notion</h2>
        {connected !== null && (
          <span className={`text-sm ${connected ? "text-doom" : "text-muted"}`}>
            {connected ? "Connected" : "Not connected"}
          </span>
        )}
      </div>
      <p className="leading-relaxed text-muted">
        DOOMBOT searches and reads the Notion pages you share with it. It only reads, and it cannot change or delete anything in Notion.
      </p>
      {connected !== null && !available && (
        <p className="text-sm text-muted">Notion sign-in is not set up on this server yet.</p>
      )}
      <div className="flex flex-wrap gap-2">
        {available && (
          <a href="/api/notion/connect" className="rounded-xl bg-doom px-4 py-2.5 text-sm font-semibold text-canvas">
            {connected ? "Reconnect Notion" : "Connect Notion"}
          </a>
        )}
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
