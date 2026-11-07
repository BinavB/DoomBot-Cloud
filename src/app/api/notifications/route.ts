import { NextResponse } from "next/server";
import { clearNotifications, deleteNotification, listNotifications, markAllRead, unreadCount } from "@/lib/notifications";
import { withUser } from "@/lib/auth/route";

export const GET = withUser(async () => {
  const [notifications, unread] = await Promise.all([listNotifications(), unreadCount()]);
  return NextResponse.json({
    notifications,
    unread,
    latest: notifications.find((notification) => !notification.read) ?? null,
  });
});

export const POST = withUser(async (request: Request) => {
  const body = (await request.json()) as { action?: unknown };
  if (body.action !== "read-all") {
    return NextResponse.json({ error: "Send the action read-all." }, { status: 400 });
  }
  await markAllRead();
  return NextResponse.json({ ok: true });
});

export const DELETE = withUser(async (request: Request) => {
  const body = (await request.json()) as { id?: unknown; all?: unknown };
  if (body.all === true) {
    await clearNotifications();
    return NextResponse.json({ ok: true });
  }
  if (typeof body.id !== "number") {
    return NextResponse.json({ error: "Send a numeric id, or all set to true." }, { status: 400 });
  }
  if (!(await deleteNotification(body.id))) {
    return NextResponse.json({ error: "That alert does not exist." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
});
