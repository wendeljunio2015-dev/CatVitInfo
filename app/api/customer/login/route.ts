import { getDatabase } from "@netlify/database";
import { NextResponse } from "next/server";
import { CUSTOMER_COOKIE, createCustomerSessionToken, customerCookieOptions, verifyPassword } from "@/lib/customer-auth";

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const email = String(data.get("email") || "").trim().toLowerCase();
    const password = String(data.get("password") || "");
    const db = getDatabase();
    const rows = await db.sql`SELECT id, password_hash FROM customers WHERE LOWER(email) = ${email} LIMIT 1`;
    if (!rows.length || !verifyPassword(password, String(rows[0].password_hash || ""))) {
      return NextResponse.redirect(new URL("/cliente/login?error=invalid", request.url), 303);
    }
    const id = String(rows[0].id);
    await db.sql`UPDATE customers SET last_login_at=NOW(), updated_at=NOW() WHERE id=${id}`;
    const response = NextResponse.redirect(new URL("/cliente/minha-conta", request.url), 303);
    response.cookies.set(CUSTOMER_COOKIE, createCustomerSessionToken(id), customerCookieOptions());
    return response;
  } catch {
    return NextResponse.redirect(new URL("/cliente/login?error=failed", request.url), 303);
  }
}
