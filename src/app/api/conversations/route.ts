import { NextResponse } from "next/server";
import { withUser } from "@/lib/auth/route";
import { createConversation, listConversations } from "@/lib/conversations";

export const GET = withUser(async () => NextResponse.json({ conversations: await listConversations() }));

export const POST = withUser(async () => NextResponse.json({ conversation: await createConversation() }, { status: 201 }));
