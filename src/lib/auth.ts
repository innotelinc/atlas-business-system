import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const SESSION_COOKIE = "atlas_session";
const DRAFT_COOKIE = "atlas_draft";
const SESSION_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || "dev-secret-change-me-0123456789abcdef",
);
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export type SessionUser = {
  id: string;
  email: string;
  role: "CLIENT" | "ADMIN";
  name: string | null;
};

export async function createSession(user: {
  id: string;
  email: string;
  role: "CLIENT" | "ADMIN";
  name: string | null;
}) {
  const token = await new SignJWT({ email: user.email, role: user.role, name: user.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SESSION_SECRET);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SESSION_SECRET);
    if (!payload.sub) return null;
    return {
      id: payload.sub,
      email: (payload.email as string) ?? "",
      role: (payload.role as "CLIENT" | "ADMIN") ?? "CLIENT",
      name: (payload.name as string | null) ?? null,
    };
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireAdmin(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/portal");
  return session;
}

// ---- Formation draft cookie (used by the formation wizard before an account exists) ----

export async function getDraftId(): Promise<string | null> {
  const store = await cookies();
  return store.get(DRAFT_COOKIE)?.value ?? null;
}

export async function setDraftId(id: string) {
  const store = await cookies();
  store.set(DRAFT_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearDraftId() {
  const store = await cookies();
  store.delete(DRAFT_COOKIE);
}
