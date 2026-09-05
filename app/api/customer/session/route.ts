import { getDatabase } from "@netlify/database";
import { NextResponse } from "next/server";
import { getAuthenticatedCustomerId } from "@/lib/customer-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const customerId = await getAuthenticatedCustomerId();
    if (!customerId) return NextResponse.json({ authenticated: false });

    const db = getDatabase();
    const rows = await db.sql`SELECT id,name FROM customers WHERE id=${customerId} LIMIT 1`;
    if (!rows.length) return NextResponse.json({ authenticated: false });

    return NextResponse.json({
      authenticated: true,
      customer: { id: String(rows[0].id), name: String(rows[0].name || "Cliente") },
    });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}
