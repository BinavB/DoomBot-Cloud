import { NextResponse } from "next/server";
import { decideApproval, listPendingApprovals, listRecentDecisions, type ApprovalDecision } from "@/lib/agent/approvals";
import { withUser } from "@/lib/auth/route";

const decisions: ApprovalDecision[] = ["approve", "always", "deny"];

export const GET = withUser(async () => {
  return NextResponse.json({
    approvals: await listPendingApprovals(),
    history: await listRecentDecisions(),
  });
});

export const POST = withUser(async (request: Request) => {
  const body = (await request.json()) as { id?: unknown; decision?: unknown };
  const decision = decisions.find((candidate) => candidate === body.decision);
  if (typeof body.id !== "number" || !decision) {
    return NextResponse.json(
      { error: "Send a numeric id and a decision of approve, always or deny." },
      { status: 400 },
    );
  }

  const approval = await decideApproval(body.id, decision);
  if (!approval) {
    return NextResponse.json({ error: "That approval is no longer pending." }, { status: 404 });
  }
  return NextResponse.json({ approval });
});
