import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { id } = await params;
  const message = await prisma.message.findUnique({ where: { id } });
  if (!message) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (message.recipientId) return NextResponse.json({ error: "Not an inbox message" }, { status: 400 });

  await prisma.message.update({
    where: { id },
    data: { readAt: message.readAt ?? new Date() },
  });
  return NextResponse.json({ ok: true });
}
