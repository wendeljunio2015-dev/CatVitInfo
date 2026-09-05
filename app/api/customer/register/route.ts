import { getDatabase } from "@netlify/database";
import { NextResponse } from "next/server";
import { CUSTOMER_COOKIE, createCustomerSessionToken, customerCookieOptions, hashPassword } from "@/lib/customer-auth";

function normalizePhone(value: string) { return value.replace(/\D/g, "").slice(0, 20); }

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const name = String(data.get("name") || "").trim().slice(0, 120);
    const email = String(data.get("email") || "").trim().toLowerCase().slice(0, 160);
    const phone = normalizePhone(String(data.get("phone") || ""));
    const password = String(data.get("password") || "");
    const city = String(data.get("city") || "").trim().slice(0, 120) || null;
    if (!name || !email || password.length < 6) return NextResponse.redirect(new URL("/cliente/cadastro?error=invalid", request.url), 303);

    const db = getDatabase();
    const existing = phone
      ? await db.sql`SELECT id,password_hash FROM customers WHERE LOWER(email)=${email} OR phone=${phone} ORDER BY CASE WHEN LOWER(email)=${email} THEN 0 ELSE 1 END LIMIT 1`
      : await db.sql`SELECT id,password_hash FROM customers WHERE LOWER(email)=${email} LIMIT 1`;

    if (existing.length && existing[0].password_hash) return NextResponse.redirect(new URL("/cliente/login?error=exists", request.url), 303);

    let id: string;
    if (existing.length) {
      id = String(existing[0].id);
      await db.sql`UPDATE customers SET name=${name}, email=${email}, phone=${phone || null}, city=${city}, password_hash=${hashPassword(password)}, updated_at=NOW() WHERE id=${id}`;
    } else {
      id = crypto.randomUUID();
      await db.sql`INSERT INTO customers (id,name,email,phone,city,password_hash) VALUES (${id},${name},${email},${phone || null},${city},${hashPassword(password)})`;
    }

    const response = NextResponse.redirect(new URL("/cliente/minha-conta", request.url), 303);
    response.cookies.set(CUSTOMER_COOKIE, createCustomerSessionToken(id), customerCookieOptions());
    return response;
  } catch {
    return NextResponse.redirect(new URL("/cliente/cadastro?error=failed", request.url), 303);
  }
}
