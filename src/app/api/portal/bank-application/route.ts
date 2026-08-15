import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { maybeSendBankStatus } from "@/lib/email";

const schema = z.object({
  businessName: z.string().min(1),
  legalName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(7),
  dob: z.string().optional().nullable(),
  ssn: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  let body;
  try {
    body = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Please fill in all required fields." }, { status: 400 });
  }

  const formation = await prisma.formation.findFirst({
    where: { userId: session.id, archivedAt: null },
    orderBy: { createdAt: "desc" },
  });

  const app = await prisma.bankApplication.create({
    data: {
      formationId: formation?.id ?? null,
      businessName: body.businessName,
      legalName: body.legalName,
      email: body.email,
      phone: body.phone,
      dob: body.dob ?? null,
      ssn: body.ssn ?? null,
      address: body.address ?? null,
      notes: body.notes ?? null,
    },
  });

  // Confirm receipt so the client knows their application is in.
  await maybeSendBankStatus({
    to: app.email,
    businessName: app.businessName,
    status: "received",
    formationId: app.formationId,
  });

  return NextResponse.json({ ok: true, id: app.id });
}
