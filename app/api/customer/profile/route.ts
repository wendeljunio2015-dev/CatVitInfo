import { getDatabase } from "@netlify/database";
import { NextResponse } from "next/server";
import { getAuthenticatedCustomerId } from "@/lib/customer-auth";

function normalizePhone(value: string) { return value.replace(/\D/g, "").slice(0, 20); }

export async function POST(request: Request) {
  const customerId = await getAuthenticatedCustomerId();
  if (!customerId) return NextResponse.redirect(new URL("/cliente/login", request.url), 303);

  try {
    const data = await request.formData();
    const name = String(data.get("name") || "").trim().slice(0, 120);
    const email = String(data.get("email") || "").trim().toLowerCase().slice(0, 160);
    const phone = normalizePhone(String(data.get("phone") || ""));
    const city = String(data.get("city") || "").trim().slice(0, 120) || null;
    if (!name || !email) return NextResponse.redirect(new URL("/cliente/minha-conta?profile=invalid", request.url), 303);

    const db = getDatabase();
    const emailMatch = await db.sql`SELECT id FROM customers WHERE LOWER(email)=${email} AND id<>${customerId} LIMIT 1`;
    if (emailMatch.length) return NextResponse.redirect(new URL("/cliente/minha-conta?profile=email_exists", request.url), 303);

    if (phone) {
      const phoneMatch = await db.sql`SELECT id FROM customers WHERE phone=${phone} AND id<>${customerId} LIMIT 1`;
      if (phoneMatch.length) return NextResponse.redirect(new URL("/cliente/minha-conta?profile=phone_exists", request.url), 303);
    }

    await db.sql`UPDATE customers SET name=${name},email=${email},phone=${phone || null},city=${city},updated_at=NOW() WHERE id=${customerId}`;
    return NextResponse.redirect(new URL("/cliente/minha-conta?profile=saved", request.url), 303);
  } catch {
    return NextResponse.redirect(new URL("/cliente/minha-conta?profile=failed", request.url), 303);
  }
}
