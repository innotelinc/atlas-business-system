import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { maybeSendBankStatus } from "@/lib/email";

const schema = z.object({
  status: z.enum(["received", "in_review", "approved", "entered", "rejected", "completed"]).optional(),
  detailsVerified: z.boolean().optional(),
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
  const existing = await prisma.bankApplication.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (body.status !== undefined) {
    data.status = body.status;
    // Record when the backend office marks the application as entered.
    if (body.status === "entered" && existing.status !== "entered") {
      data.enteredAt = new Date();
    } else if (body.status !== "entered" && existing.enteredAt) {
      data.enteredAt = null;
    }
  }
  if (body.detailsVerified !== undefined) {
    data.detailsVerified = body.detailsVerified;
    if (body.detailsVerified && !existing.detailsVerifiedAt) {
      data.detailsVerifiedAt = new Date();
    } else if (!body.detailsVerified) {
      data.detailsVerifiedAt = null;
    }
  }

  const app = await prisma.bankApplication.update({ where: { id }, data });

  // Notify the client when their application moves to a new status.
  if (body.status !== undefined && existing.status !== body.status) {
    await maybeSendBankStatus({
      to: app.email,
      businessName: app.businessName,
      status: body.status,
      formationId: app.formationId,
    });
  }

  return NextResponse.json({ ok: true, app });
}
