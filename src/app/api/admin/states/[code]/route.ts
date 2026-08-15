import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const feeSchema = z.object({
  type: z.enum(["LLC", "FOR_PROFIT", "NON_PROFIT"]),
  stateFeeCents: z.number().int().min(0),
  documentUrl: z.string().nullable().optional(),
  filingTime: z.string().nullable().optional(),
  verified: z.boolean().optional(),
  sourceNote: z.string().nullable().optional(),
});

const schema = z.object({
  sosSiteUrl: z.string().optional(),
  nameSearchUrl: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  fee: feeSchema.optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ code: string }> }) {
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

  const { code } = await params;
  const stateCode = code.toUpperCase();
  const state = await prisma.state.findUnique({ where: { code: stateCode } });
  if (!state) return NextResponse.json({ error: "State not found" }, { status: 404 });

  const stateData: Record<string, unknown> = {};
  if (body.sosSiteUrl !== undefined) stateData.sosSiteUrl = body.sosSiteUrl;
  if (body.nameSearchUrl !== undefined) stateData.nameSearchUrl = body.nameSearchUrl;
  if (body.notes !== undefined) stateData.notes = body.notes;
  if (Object.keys(stateData).length > 0) {
    await prisma.state.update({ where: { code: stateCode }, data: stateData });
  }

  if (body.fee) {
    const f = body.fee;
    const existing = await prisma.stateFee.findUnique({
      where: { stateCode_type: { stateCode, type: f.type } },
    });
    if (existing) {
      await prisma.stateFee.update({
        where: { stateCode_type: { stateCode, type: f.type } },
        data: {
          stateFeeCents: f.stateFeeCents,
          documentUrl: f.documentUrl ?? undefined,
          filingTime: f.filingTime ?? undefined,
          verified: f.verified ?? undefined,
          sourceNote: f.sourceNote ?? undefined,
        },
      });
    } else {
      await prisma.stateFee.create({
        data: {
          stateCode,
          type: f.type,
          stateFeeCents: f.stateFeeCents,
          documentUrl: f.documentUrl ?? null,
          filingTime: f.filingTime ?? null,
          verified: f.verified ?? false,
          sourceNote: f.sourceNote ?? null,
        },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
