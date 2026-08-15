import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const schema = z.object({
  completed: z.boolean().optional(),
  value: z.string().optional().nullable(),
});

export async function POST(req: Request, { params }: { params: Promise<{ itemId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { itemId } = await params;
  const item = await prisma.checklistItem.findUnique({ where: { id: itemId } });
  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  const formation = await prisma.formation.findFirst({
    where: { userId: session.id },
    orderBy: { createdAt: "desc" },
  });
  if (!formation) return NextResponse.json({ error: "No formation yet" }, { status: 404 });

  let body;
  try {
    body = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const existing = await prisma.checklistEntry.findUnique({
    where: { formationId_itemId: { formationId: formation.id, itemId } },
  });

  const completed = body.completed ?? existing?.completed ?? false;
  const entry = await prisma.checklistEntry.upsert({
    where: { formationId_itemId: { formationId: formation.id, itemId } },
    update: {
      completed,
      value: body.value !== undefined ? body.value : existing?.value,
      completedAt: completed ? new Date() : null,
    },
    create: {
      formationId: formation.id,
      itemId,
      completed,
      value: body.value ?? null,
      completedAt: completed ? new Date() : null,
    },
  });
  return NextResponse.json({ ok: true, entry });
}
