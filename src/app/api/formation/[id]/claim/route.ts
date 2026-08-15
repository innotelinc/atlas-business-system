import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const formation = await prisma.formation.findUnique({ where: { id } });
  if (!formation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (formation.userId && formation.userId !== session.id) {
    return NextResponse.json({ error: "Formation already claimed" }, { status: 409 });
  }

  const updated = await prisma.formation.update({
    where: { id },
    data: { userId: session.id, portalAccess: true },
  });

  return NextResponse.json({ ok: true, formation: updated });
}
