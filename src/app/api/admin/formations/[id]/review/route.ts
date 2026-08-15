import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { maybeSendAnalystApproved } from "@/lib/email";

const schema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  notes: z.string().optional().nullable(),
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
  const formation = await prisma.formation.findUnique({ where: { id } });
  if (!formation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.formation.update({
    where: { id },
    data: {
      analystReview: body.decision,
      analystNotes: body.notes ?? null,
      analystReviewedAt: new Date(),
    },
  });

  if (body.decision === "APPROVED") {
    await maybeSendAnalystApproved(id);
  }

  return NextResponse.json({ ok: true, formation: updated });
}
