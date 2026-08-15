import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || "dev-secret-change-me-0123456789abcdef",
);

export async function proxy(req: NextRequest) {
  const token = req.cookies.get("atlas_session")?.value;
  let session: { sub?: string; role?: string } | null = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, SESSION_SECRET);
      session = payload;
    } catch {
      session = null;
    }
  }

  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (!session || session.role !== "ADMIN") {
      const url = new URL("/login", req.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith("/portal")) {
    if (!session) {
      const url = new URL("/login", req.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/portal/:path*"],
};
