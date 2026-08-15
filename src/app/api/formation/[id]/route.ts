import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  businessName: z.string().optional().nullable(),
  stateCode: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "NAME_CHECK", "DOCUMENT_BUILD", "SIGNED", "PAYMENT_PENDING", "PAID", "FILED", "COMPLETED", "CANCELLED"]).optional(),
  signature: z.string().optional().nullable(),
  contractSignedAt: z.string().optional().nullable(),
  nameCheck: z
    .object({
      sosSearched: z.boolean().optional(),
      sosResults: z.string().optional().nullable(),
      claimedAvailable: z.boolean().optional(),
      similarNames: z.string().optional().nullable(),
    })
    .optional(),
  document: z.record(z.string(), z.unknown()).optional(),
  selectedServices: z.array(z.string()).optional(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const formation = await prisma.formation.findUnique({
    where: { id },
    include: { nameCheck: true, document: true, state: true, services: { include: { service: true } } },
  });
  if (!formation) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ formation });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body;
  try {
    body = patchSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const existing = await prisma.formation.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (body.businessName !== undefined) data.businessName = body.businessName;
  if (body.stateCode !== undefined) data.stateCode = body.stateCode;
  if (body.status !== undefined) data.status = body.status;
  if (body.signature !== undefined) data.signature = body.signature;
  if (body.contractSignedAt !== undefined)
    data.contractSignedAt = body.contractSignedAt ? new Date(body.contractSignedAt) : null;

  if (body.nameCheck) {
    const nc = await prisma.nameCheck.upsert({
      where: { formationId: id },
      update: {
        sosSearched: body.nameCheck.sosSearched ?? undefined,
        sosResults: body.nameCheck.sosResults ?? undefined,
        claimedAvailable: body.nameCheck.claimedAvailable ?? undefined,
        similarNames: body.nameCheck.similarNames ?? undefined,
        checkedAt: new Date(),
      },
      create: {
        formationId: id,
        sosSearched: body.nameCheck.sosSearched ?? false,
        sosResults: body.nameCheck.sosResults ?? null,
        claimedAvailable: body.nameCheck.claimedAvailable ?? false,
        similarNames: body.nameCheck.similarNames ?? null,
        checkedAt: new Date(),
      },
    });
    data.nameCheck = undefined; // handled above
  }

  if (body.document) {
    await prisma.document.upsert({
      where: { formationId: id },
      update: { data: body.document as object, generatedAt: new Date() },
      create: { formationId: id, data: body.document as object, generatedAt: new Date() },
    });
  }

  if (body.selectedServices) {
    const serviceIds = body.selectedServices;
    await prisma.$transaction([
      prisma.formationService.deleteMany({ where: { formationId: id } }),
      ...serviceIds.map((serviceId) =>
        prisma.formationService.create({ data: { formationId: id, serviceId, quantity: 1 } }),
      ),
    ]);
  }

  const updated = await prisma.formation.update({ where: { id }, data });

  // Recompute totals so the wizard always shows current pricing.
  const effectiveStateCode = body.stateCode ?? existing.stateCode;
  const fee = effectiveStateCode
    ? await prisma.stateFee.findUnique({
        where: { stateCode_type: { stateCode: effectiveStateCode, type: existing.type } },
      })
    : null;
  const pricing = await prisma.pricingConfig.findUnique({ where: { id: "single" } });
  const services = await prisma.formationService.findMany({
    where: { formationId: id },
    include: { service: true },
  });
  const recurring = services
    .filter((s) => s.service.recurring)
    .reduce((sum, s) => sum + s.service.priceCents * s.quantity, 0);
  const oneTime = services
    .filter((s) => !s.service.recurring)
    .reduce((sum, s) => sum + s.service.priceCents * s.quantity, 0);
  const stateFeeCents = fee?.stateFeeCents ?? 0;
  const serviceFeeCents = pricing?.serviceFeeCents ?? 0;
  await prisma.formation.update({
    where: { id },
    data: {
      stateFeeCents,
      serviceFeeCents,
      totalCents: stateFeeCents + serviceFeeCents + oneTime + recurring,
    },
  });

  return NextResponse.json({ ok: true, formation: updated });
}
