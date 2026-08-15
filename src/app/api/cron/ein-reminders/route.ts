import { NextResponse } from "next/server";
import { runEinReminders } from "@/lib/ein-reminders";

// Vercel Cron hits this GET endpoint (see vercel.json). It is also a normal
// endpoint, so it's guarded: only requests carrying `Authorization: Bearer
// $CRON_SECRET` (which Vercel Cron sends automatically) can trigger a run.
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runEinReminders();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("EIN reminder cron failed:", e);
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
