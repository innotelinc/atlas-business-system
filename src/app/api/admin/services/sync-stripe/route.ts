import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { syncAllServicePrices } from "@/lib/stripe-sync";
import { stripeEnabled } from "@/lib/stripe";

export async function POST() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }
  if (!stripeEnabled) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 400 });
  }

  try {
    const result = await syncAllServicePrices();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
