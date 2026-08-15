import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { transitionFiling } from "@/lib/filings";

const schema = z.object({
  to: z.enum(["READY", "SUBMITTED", "FILED", "REJECTED", "NEEDS_ATTENTION"]),
  confirmationNumber: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
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
  const filing = await prisma.filing.findUnique({ where: { id } });
  if (!filing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const updated = await transitionFiling({
      filingId: id,
      to: body.to,
      by: session.email,
      confirmationNumber: body.confirmationNumber ?? undefined,
      notes: body.notes ?? undefined,
    });
    return NextResponse.json({ ok: true, filing: updated });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
