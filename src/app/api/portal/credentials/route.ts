import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const patchSchema = z.object({
  ein: z.string().optional().nullable(),
  establishedDate: z.string().optional().nullable(),
  officers: z.array(z.object({ name: z.string(), title: z.string() })).optional(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
});

async function getUserFormation(session: { id: string }) {
  return prisma.formation.findFirst({
    where: { userId: session.id },
    orderBy: { createdAt: "desc" },
  });
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const formation = await getUserFormation(session);
  if (!formation) return NextResponse.json({ error: "No formation yet" }, { status: 404 });

  const credentials = await prisma.credentials.findUnique({
    where: { formationId: formation.id },
  });
  return NextResponse.json({ credentials, formation });
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const formation = await getUserFormation(session);
  if (!formation) return NextResponse.json({ error: "No formation yet" }, { status: 404 });

  let body;
  try {
    body = patchSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (body.ein !== undefined) data.ein = body.ein;
  if (body.establishedDate !== undefined)
    data.establishedDate = body.establishedDate ? new Date(body.establishedDate) : null;
  if (body.officers !== undefined) data.officers = body.officers;
  if (body.address !== undefined) data.address = body.address;
  if (body.phone !== undefined) data.phone = body.phone;
  if (body.email !== undefined) data.email = body.email;
  if (body.website !== undefined) data.website = body.website;

  const credentials = await prisma.credentials.upsert({
    where: { formationId: formation.id },
    update: data,
    create: { formationId: formation.id, ...data },
  });
  return NextResponse.json({ ok: true, credentials });
}
