import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const formation = await prisma.formation.findUnique({ where: { id } });
  if (!formation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.formation.update({
    where: { id },
    data: { paymentStatus: "paid", status: "PAID" },
  });

  return NextResponse.json({ ok: true });
}
