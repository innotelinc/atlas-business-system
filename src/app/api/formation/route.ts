import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { setDraftId } from "@/lib/auth";

const bodySchema = z.object({
  type: z.enum(["LLC", "FOR_PROFIT", "NON_PROFIT"]),
});

export async function POST(req: Request) {
  try {
    const body = bodySchema.parse(await req.json());
    const formation = await prisma.formation.create({
      data: { type: body.type, status: "DRAFT" },
    });
    await setDraftId(formation.id);
    return NextResponse.json({ id: formation.id });
  } catch (e) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
