import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const schema = z.object({
  title: z.string().optional(),
  description: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  urlLabel: z.string().nullable().optional(),
  section: z.enum(["business", "credit"]).optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  let body;
  try {
    body = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { id } = await params;
  const data: Record<string, unknown> = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.description !== undefined) data.description = body.description;
  if (body.url !== undefined) data.url = body.url;
  if (body.urlLabel !== undefined) data.urlLabel = body.urlLabel;
  if (body.section !== undefined) data.section = body.section;
  if (body.active !== undefined) data.active = body.active;
  if (body.sortOrder !== undefined) data.sortOrder = body.sortOrder;

  const item = await prisma.checklistItem.update({ where: { id }, data });
  return NextResponse.json({ ok: true, item });
}
