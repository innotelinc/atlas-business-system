import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { sendMessageEmail } from "@/lib/email";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const messages = await prisma.message.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      sender: { select: { id: true, name: true, email: true, role: true } },
      recipient: { select: { id: true, name: true, email: true, role: true } },
      formation: { select: { id: true, businessName: true } },
    },
  });

  const unread = messages.filter((m) => !m.recipientId && !m.readAt).length;

  return NextResponse.json({ messages, unread });
}

const replySchema = z.object({
  inReplyTo: z.string().min(1),
  body: z.string().min(1).max(5000),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  let body;
  try {
    body = replySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Please include a reply." }, { status: 400 });
  }

  const original = await prisma.message.findUnique({
    where: { id: body.inReplyTo },
    include: { sender: true },
  });
  if (!original) return NextResponse.json({ error: "Message not found" }, { status: 404 });

  // Reply to the original sender if they are a client; otherwise reply to the
  // original recipient (a client the admin was messaging).
  const client =
    original.sender.role === "CLIENT" ? original.sender : original.recipientId ? await prisma.user.findUnique({ where: { id: original.recipientId } }) : null;
  if (!client) return NextResponse.json({ error: "No client to reply to" }, { status: 400 });

  const message = await prisma.message.create({
    data: {
      senderId: session.id,
      recipientId: client.id,
      formationId: original.formationId,
      subject: original.subject.startsWith("Re:") ? original.subject : `Re: ${original.subject}`,
      body: body.body,
    },
  });

  // Notify the client by email so they know to check their portal.
  await sendMessageEmail({
    to: client.email,
    clientName: client.name ?? client.email,
    subject: message.subject,
    preview: body.body.slice(0, 140),
  });

  return NextResponse.json({ ok: true, id: message.id });
}
