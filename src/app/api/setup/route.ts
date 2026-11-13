import { NextResponse } from "next/server";
import { withUser } from "@/lib/auth/route";
import { listSetupItems } from "@/lib/setup";

export const GET = withUser(async () => NextResponse.json({ items: await listSetupItems() }));
