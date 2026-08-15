import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const schema = z.object({
  name: z.string().optional(),
  description: z.string().nullable().optional(),
  priceCents: z.number().int().min(0).optional(),
  recurring: z.boolean().optional(),
  interval: z.string().nullable().optional(),
  active: z.boolean().optional(),
  stripePriceId: z.string().nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

  const { id } = await params;
  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.description !== undefined) data.description = body.description;
  if (body.priceCents !== undefined) data.priceCents = body.priceCents;
  if (body.recurring !== undefined) data.recurring = body.recurring;
  if (body.interval !== undefined) data.interval = body.interval;
  if (body.active !== undefined) data.active = body.active;
  if (body.stripePriceId !== undefined) data.stripePriceId = body.stripePriceId;

  const service = await prisma.service.update({ where: { id }, data });
  return NextResponse.json({ ok: true, service });
}
