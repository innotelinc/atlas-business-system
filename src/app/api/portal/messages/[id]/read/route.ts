import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const message = await prisma.message.findUnique({ where: { id } });
  if (!message) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (message.recipientId !== session.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.message.update({
    where: { id },
    data: { readAt: message.readAt ?? new Date() },
  });
  return NextResponse.json({ ok: true });
}
