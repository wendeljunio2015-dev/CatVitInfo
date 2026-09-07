import { getDatabase } from "@netlify/database";
import { NextResponse } from "next/server";
import { getSellerRef } from "@/lib/seller-ref";

export const dynamic = "force-dynamic";

export async function GET() {
  const sellerId = await getSellerRef();
  if (!sellerId) return NextResponse.json({ attributed: false }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  const db = getDatabase();
  const rows = await db.sql`SELECT id, name FROM sellers WHERE id=${sellerId} AND active=TRUE LIMIT 1`;
  if (!rows.length) return NextResponse.json({ attributed: false }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  return NextResponse.json(
    { attributed: true, seller: { id: String(rows[0].id), name: String(rows[0].name) } },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
