import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPricingConfig, computeTotals, type ServiceLine } from "@/lib/pricing";
import { stripe, stripeEnabled, getAppUrl } from "@/lib/stripe";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const formation = await prisma.formation.findUnique({
    where: { id },
    include: { state: true, services: { include: { service: true } } },
  });
  if (!formation) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!formation.stateCode || !formation.state) {
    return NextResponse.json({ error: "Select a state first" }, { status: 400 });
  }

  const fee = await prisma.stateFee.findUnique({
    where: { stateCode_type: { stateCode: formation.stateCode, type: formation.type } },
  });
  const pricing = await getPricingConfig();
  const serviceFeeCents = pricing?.serviceFeeCents ?? 0;
  const stateFeeCents = fee?.stateFeeCents ?? 0;

  const services: ServiceLine[] = formation.services.map((fs) => ({
    id: fs.service.id,
    key: fs.service.key,
    name: fs.service.name,
    priceCents: fs.service.priceCents,
    recurring: fs.service.recurring,
    interval: fs.service.interval,
    quantity: fs.quantity,
  }));
  const totals = computeTotals(stateFeeCents, serviceFeeCents, services);

  await prisma.formation.update({
    where: { id },
    data: {
      stateFeeCents: totals.stateFeeCents,
      serviceFeeCents: totals.serviceFeeCents,
      totalCents: totals.totalCents,
      status: "PAYMENT_PENDING",
    },
  });

  if (!stripeEnabled) {
    // Demo mode — no Stripe keys configured. The wizard shows a simulated payment page.
    return NextResponse.json({ demo: true, totals });
  }

  const lineItems = [
    {
      price_data: {
        currency: "usd",
        product_data: {
          name: `${formation.state.name} ${formation.type === "LLC" ? "LLC" : formation.type === "FOR_PROFIT" ? "For-Profit Corporation" : "Non-Profit Corporation"} — State Filing Fee`,
        },
        unit_amount: totals.stateFeeCents,
      },
      quantity: 1,
    },
    {
      price_data: {
        currency: "usd",
        product_data: { name: "Atlas Business System — Formation Service Fee" },
        unit_amount: totals.serviceFeeCents,
      },
      quantity: 1,
    },
    ...services.map((s) => ({
      price_data: {
        currency: "usd",
        product_data: { name: `${s.name}${s.recurring ? ` (per ${s.interval ?? "year"})` : ""}` },
        unit_amount: s.priceCents,
        recurring: s.recurring ? { interval: (s.interval as "year" | "month") ?? "year" } : undefined,
      },
      quantity: s.quantity,
    })),
  ];

  const hasRecurring = services.some((s) => s.recurring);
  const session = await stripe!.checkout.sessions.create({
    mode: hasRecurring ? "subscription" : "payment",
    line_items: lineItems,
    success_url: `${getAppUrl()}/formation?paid=1`,
    cancel_url: `${getAppUrl()}/formation`,
    client_reference_id: id,
    metadata: { formationId: id },
  });

  await prisma.formation.update({
    where: { id },
    data: { stripeCheckoutId: session.id },
  });

  return NextResponse.json({ demo: false, url: session.url, totals });
}
