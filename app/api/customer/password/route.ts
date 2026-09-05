import { getDatabase } from "@netlify/database";
import { NextResponse } from "next/server";
import { getAuthenticatedCustomerId, hashPassword, verifyPassword } from "@/lib/customer-auth";

export async function POST(request: Request) {
  const customerId = await getAuthenticatedCustomerId();
  if (!customerId) return NextResponse.redirect(new URL("/cliente/login", request.url), 303);

  try {
    const data = await request.formData();
    const currentPassword = String(data.get("currentPassword") || "");
    const newPassword = String(data.get("newPassword") || "");
    const confirmPassword = String(data.get("confirmPassword") || "");
    if (newPassword.length < 8 || newPassword !== confirmPassword) {
      return NextResponse.redirect(new URL("/cliente/minha-conta?password=invalid", request.url), 303);
    }

    const db = getDatabase();
    const rows = await db.sql`SELECT password_hash FROM customers WHERE id=${customerId} LIMIT 1`;
    if (!rows.length || !verifyPassword(currentPassword, String(rows[0].password_hash || ""))) {
      return NextResponse.redirect(new URL("/cliente/minha-conta?password=wrong", request.url), 303);
    }

    await db.sql`UPDATE customers SET password_hash=${hashPassword(newPassword)},updated_at=NOW() WHERE id=${customerId}`;
    return NextResponse.redirect(new URL("/cliente/minha-conta?password=saved", request.url), 303);
  } catch {
    return NextResponse.redirect(new URL("/cliente/minha-conta?password=failed", request.url), 303);
  }
}
