import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { maybeSendBankStatus } from "@/lib/email";

const schema = z.object({
  status: z.enum(["received", "in_review", "approved", "rejected", "completed"]),
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

  const app = await prisma.bankApplication.update({
    where: { id },
    data: { status: body.status },
  });

  // Notify the client when their application moves to a new status.
  if (existing.status !== body.status) {
    await maybeSendBankStatus({
      to: app.email,
      businessName: app.businessName,
      status: body.status,
      formationId: app.formationId,
    });
  }

  return NextResponse.json({ ok: true, app });
}
