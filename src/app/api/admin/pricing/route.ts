import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const schema = z.object({
  serviceFeeCentsLLC: z.number().int().min(0).optional(),
  serviceFeeCentsForProfit: z.number().int().min(0).optional(),
  serviceFeeCentsNonProfit: z.number().int().min(0).optional(),
  competitorRetailCents: z.number().int().min(0).optional(),
  competitorName: z.string().min(1).optional(),
});

export async function PATCH(req: Request) {
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

  const data: Record<string, unknown> = {};
  if (body.serviceFeeCentsLLC !== undefined) data.serviceFeeCentsLLC = body.serviceFeeCentsLLC;
  if (body.serviceFeeCentsForProfit !== undefined) data.serviceFeeCentsForProfit = body.serviceFeeCentsForProfit;
  if (body.serviceFeeCentsNonProfit !== undefined) data.serviceFeeCentsNonProfit = body.serviceFeeCentsNonProfit;
  if (body.competitorRetailCents !== undefined) data.competitorRetailCents = body.competitorRetailCents;
  if (body.competitorName !== undefined) data.competitorName = body.competitorName;

  const config = await prisma.pricingConfig.upsert({
    where: { id: "single" },
    update: data,
    create: { id: "single", ...data },
  });

  return NextResponse.json({ ok: true, config });
}
