"use client";

import { useCallback, useEffect, useState } from "react";
import { announceApprovalsChanged, approvalsChangedEvent } from "@/components/events";
import { PageNotice } from "@/components/page-notice";

type Decision = "approve" | "always" | "deny";

interface PendingApproval {
  id: number;
  tool: string;
  summary: string;
  createdAt: string;
}

interface DecidedApproval {
  id: number;
  status: string;
  result: string | null;
  summary: string;
}

interface HistoryEntry {
  id: number;
  summary: string;
  status: string;
  result: string | null;
  resolvedAt: string | null;
}

interface ApprovalsData {
  approvals: PendingApproval[];
  history: HistoryEntry[];
}

const statusLabels: Record<string, string> = {
  approved: "Allowed",
  denied: "Refused",
  failed: "Failed",
};

export function ApprovalsView() {
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [lastDecision, setLastDecision] = useState<DecidedApproval | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch("/api/approvals")
      .then((response) => response.json() as Promise<ApprovalsData>)
      .then((data) => {
        setApprovals(data.approvals);
        setHistory(data.history);
      })
      .catch(() => setError("Approvals could not load. Reload the page to try again."))
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    load();
    window.addEventListener(approvalsChangedEvent, load);
    return () => window.removeEventListener(approvalsChangedEvent, load);
  }, [load]);

  async function decide(id: number, decision: Decision) {
    setError(null);
    const response = await fetch("/api/approvals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, decision }),
    });
    const data = (await response.json()) as { approval?: DecidedApproval; error?: string };
    if (!response.ok || !data.approval) {
      setError(data.error ?? "That action is no longer waiting.");
    } else {
      setLastDecision(data.approval);
    }
    announceApprovalsChanged();
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 md:px-6">
      <p className="text-sm text-muted">
        DOOMBOT asks before it sends messages, spends money or changes files. Nothing here happens until you approve it.
      </p>

      {lastDecision && (
        <PageNotice tone={lastDecision.status === "approved" ? "success" : "neutral"}>
          {lastDecision.status === "approved" && `Done: ${lastDecision.result ?? lastDecision.summary}`}
          {lastDecision.status === "denied" && `Refused: ${lastDecision.summary}`}
          {lastDecision.status === "failed" && `It failed: ${lastDecision.result ?? "unknown error"}`}
        </PageNotice>
      )}

      {error && <PageNotice tone="error">{error}</PageNotice>}

      {loaded && approvals.length === 0 && !error && <p className="text-muted">Nothing is waiting for you.</p>}

      {approvals.length > 0 && (
        <ul className="flex flex-col gap-3">
          {approvals.map((approval) => (
            <li key={approval.id} className="flex flex-col gap-4 rounded-2xl border border-line bg-panel p-5">
              <p className="max-h-80 overflow-y-auto whitespace-pre-line break-words leading-relaxed">{approval.summary}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void decide(approval.id, "approve")}
                  className="h-10 rounded-xl bg-doom px-4 text-sm font-semibold text-canvas"
                >
                  Allow once
                </button>
                <button
                  type="button"
                  onClick={() => void decide(approval.id, "always")}
                  className="h-10 rounded-xl border border-doom px-4 text-sm font-medium text-doom hover:bg-raised"
                >
                  Always allow
                </button>
                <button
                  type="button"
                  onClick={() => void decide(approval.id, "deny")}
                  className="h-10 rounded-xl border border-line px-4 text-sm font-medium hover:bg-raised"
                >
                  Refuse
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {history.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-display text-lg font-semibold">Recent decisions</h2>
          <ul className="flex flex-col divide-y divide-line rounded-2xl border border-line bg-panel">
            {history.map((entry) => (
              <li key={entry.id} className="flex items-start justify-between gap-3 px-5 py-3">
                <span className="min-w-0 truncate text-sm">{entry.summary}</span>
                <span className="shrink-0 text-xs text-muted">{statusLabels[entry.status] ?? entry.status}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
