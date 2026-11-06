import { withUser } from "@/lib/auth/route";
import { exportAccountData } from "@/lib/account-data";

export const GET = withUser(async () => {
  const data = await exportAccountData();
  return new Response(JSON.stringify({ exportedAt: new Date().toISOString(), data }, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": "attachment; filename=\"doombot-export.json\"",
      "Cache-Control": "no-store",
    },
  });
});
