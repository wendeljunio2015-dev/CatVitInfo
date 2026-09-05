import { getDatabase } from "@netlify/database";
import { NextResponse } from "next/server";
import { getSellerRef } from "@/lib/seller-ref";

const storeWhatsApp = "5562994780830";

export async function GET(request: Request) {
  const sellerId = await getSellerRef();
  let phone = storeWhatsApp;
  if (sellerId) {
    const db = getDatabase();
    const rows = await db.sql`SELECT phone FROM sellers WHERE id=${sellerId} AND active=TRUE LIMIT 1`;
    if (rows.length) phone = String(rows[0].phone || storeWhatsApp).replace(/\D/g, "");
  }
  const url = new URL(`https://wa.me/${phone}`);
  const source = new URL(request.url);
  const text = source.searchParams.get("text");
  if (text) url.searchParams.set("text", text);
  return NextResponse.redirect(url, 302);
}
