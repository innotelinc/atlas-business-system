import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

const schema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export async function POST(req: Request) {
  let body;
  try {
    body = schema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: "Invalid input. Password must be at least 8 characters." },
      { status: 400 },
    );
  }

  const existing = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with that email already exists. Sign in instead." },
      { status: 409 },
    );
  }

  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email.toLowerCase(),
      passwordHash: await bcrypt.hash(body.password, 10),
    },
  });

  await createSession({ id: user.id, email: user.email, role: user.role, name: user.name });
  return NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } });
}
