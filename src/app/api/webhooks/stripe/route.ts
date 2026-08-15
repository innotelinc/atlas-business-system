import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { maybeSendPaymentReceived } from "@/lib/email";
import { ensureFilingForFormation } from "@/lib/filings";

export async function POST(req: Request) {
  if (!stripe) return NextResponse.json({ error: "Stripe not configured" }, { status: 501 });

  const signature = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const formationId = session.metadata?.formationId;
    if (formationId) {
      await prisma.formation.update({
        where: { id: formationId },
        data: {
          paymentStatus: "paid",
          status: "PAID",
          stripeCheckoutId: session.id,
          stripeCustomerId: typeof session.customer === "string" ? session.customer : undefined,
        },
      });
      await maybeSendPaymentReceived(formationId);
      await ensureFilingForFormation(formationId);
    }
  }

  return NextResponse.json({ received: true });
}
