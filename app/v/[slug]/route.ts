import { getDatabase } from "@netlify/database";
import { NextResponse } from "next/server";
import { SELLER_COOKIE, SELLER_COOKIE_MAX_AGE } from "@/lib/seller-ref";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = getDatabase();
  const rows = await db.sql`SELECT id FROM sellers WHERE slug=${slug} AND active=TRUE LIMIT 1`;
  const response = NextResponse.redirect(new URL("/", request.url), 302);
  if (rows.length) {
    response.cookies.set(SELLER_COOKIE, String(rows[0].id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SELLER_COOKIE_MAX_AGE,
    });
  } else {
    response.cookies.set(SELLER_COOKIE, "", { path: "/", maxAge: 0 });
  }
  return response;
}
