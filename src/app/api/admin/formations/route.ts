import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getServiceFeeCents } from "@/lib/pricing";

const schema = z.object({
  businessName: z.string().min(1),
  type: z.enum(["LLC", "FOR_PROFIT", "NON_PROFIT"]),
  stateCode: z.string().length(2),
  email: z.string().email().optional().nullable(),
  status: z.enum(["DRAFT", "NAME_CHECK", "DOCUMENT_BUILD", "SIGNED", "PAYMENT_PENDING", "PAID", "FILED", "COMPLETED", "CANCELLED"]).optional(),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  let body;
  try {
    body = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const stateCode = body.stateCode.toUpperCase();
  const state = await prisma.state.findUnique({ where: { code: stateCode } });
  if (!state) return NextResponse.json({ error: "Unknown state" }, { status: 400 });

  let userId: string | null = null;
  if (body.email) {
    const user = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
    userId = user?.id ?? null;
  }

  const fee = await prisma.stateFee.findUnique({
    where: { stateCode_type: { stateCode, type: body.type } },
  });
  const pricing = await prisma.pricingConfig.findUnique({ where: { id: "single" } });
  const serviceFeeCents = getServiceFeeCents(pricing, body.type);

  const formation = await prisma.formation.create({
    data: {
      userId,
      type: body.type,
      stateCode,
      businessName: body.businessName,
      status: body.status ?? "DRAFT",
      stateFeeCents: fee?.stateFeeCents ?? 0,
      serviceFeeCents,
      totalCents: (fee?.stateFeeCents ?? 0) + serviceFeeCents,
    },
  });

  return NextResponse.json({ ok: true, id: formation.id });
}
