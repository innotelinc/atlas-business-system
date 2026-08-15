import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const result = await prisma.stateFee.updateMany({
    data: { verified: true },
  });

  return NextResponse.json({ ok: true, updated: result.count });
}
