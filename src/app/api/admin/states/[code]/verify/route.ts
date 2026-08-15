import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { code } = await params;
  const stateCode = code.toUpperCase();
  const state = await prisma.state.findUnique({ where: { code: stateCode } });
  if (!state) return NextResponse.json({ error: "State not found" }, { status: 404 });

  const result = await prisma.stateFee.updateMany({
    where: { stateCode },
    data: { verified: true },
  });

  return NextResponse.json({ ok: true, updated: result.count });
}
