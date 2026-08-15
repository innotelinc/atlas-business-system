import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const composeSchema = z.object({
  subject: z.string().min(1).max(120),
  body: z.string().min(1).max(5000),
});

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const messages = await prisma.message.findMany({
    where: {
      OR: [{ senderId: session.id }, { recipientId: session.id }],
    },
    orderBy: { createdAt: "desc" },
    include: {
      sender: { select: { id: true, name: true, email: true, role: true } },
      formation: { select: { id: true, businessName: true } },
    },
  });

  const unread = messages.filter((m) => m.recipientId === session.id && !m.readAt).length;

  return NextResponse.json({ messages, unread });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  let body;
  try {
    body = composeSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Please add a subject and message." }, { status: 400 });
  }

  const formation = await prisma.formation.findFirst({
    where: { userId: session.id, archivedAt: null },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  const message = await prisma.message.create({
    data: {
      senderId: session.id,
      recipientId: null, // Atlas support inbox
      formationId: formation?.id ?? null,
      subject: body.subject,
      body: body.body,
    },
  });

  return NextResponse.json({ ok: true, id: message.id });
}
