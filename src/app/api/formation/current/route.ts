import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDraftId, getSession } from "@/lib/auth";
import { computeTotals, getPricingConfig, getServiceFeeCents, type ServiceLine } from "@/lib/pricing";
import { getFormFields } from "@/lib/form-templates";

export async function GET() {
  // A logged-in user sees their most recent formation; otherwise use the draft cookie.
  const session = await getSession();
  let formationId = await getDraftId();
  let formation = null;

  if (formationId) {
    formation = await prisma.formation.findUnique({
      where: { id: formationId },
      include: { nameCheck: true, document: true, services: { include: { service: true } } },
    });
  }
  if (!formation && session) {
    formation = await prisma.formation.findFirst({
      where: { userId: session.id, archivedAt: null },
      orderBy: { createdAt: "desc" },
      include: { nameCheck: true, document: true, services: { include: { service: true } } },
    });
    if (formation) formationId = formation.id;
  }
  if (!formation) {
    return NextResponse.json({ formation: null });
  }

  const pricing = await getPricingConfig();
  const allServices = await prisma.service.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });

  const selectedIds = new Set(formation.services.map((fs) => fs.serviceId));
  const services: (ServiceLine & { selected: boolean })[] = allServices.map((s) => ({
    id: s.id,
    key: s.key,
    name: s.name,
    priceCents: s.priceCents,
    recurring: s.recurring,
    interval: s.interval,
    quantity: 1,
    selected: selectedIds.has(s.id),
  }));

  const state = formation.stateCode
    ? await prisma.state.findUnique({
        where: { code: formation.stateCode },
        include: { fees: true },
      })
    : null;
  const fee = state?.fees.find((f) => f.type === formation.type);

  const totals = computeTotals(
    fee?.stateFeeCents ?? 0,
    getServiceFeeCents(pricing, formation.type),
    services.filter((s) => s.selected),
  );

  return NextResponse.json({
    formation: {
      id: formation.id,
      type: formation.type,
      stateCode: formation.stateCode,
      businessName: formation.businessName,
      status: formation.status,
      paymentStatus: formation.paymentStatus,
      contractSignedAt: formation.contractSignedAt,
      signature: formation.signature,
      analystReview: formation.analystReview,
      portalAccess: formation.portalAccess,
      createdAt: formation.createdAt,
      nameCheck: formation.nameCheck,
      document: formation.document,
    },
    state: state
      ? {
          code: state.code,
          name: state.name,
          sosSiteUrl: state.sosSiteUrl,
          nameSearchUrl: state.nameSearchUrl,
          notes: state.notes,
          fee: fee
            ? {
                stateFeeCents: fee.stateFeeCents,
                filingTime: fee.filingTime,
                documentUrl: fee.documentUrl,
                verified: fee.verified,
                formFields:
                  (fee.formFields as unknown[]) ??
                  getFormFields(state.code, formation.type),
              }
            : null,
        }
      : null,
    pricing: pricing
      ? {
          serviceFeeCents: getServiceFeeCents(pricing, formation.type),
          competitorRetailCents: pricing.competitorRetailCents,
          competitorName: pricing.competitorName,
        }
      : null,
    services,
    totals,
  });
}
