import { getDatabase } from "@netlify/database";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";

function phone(value: string) { return value.replace(/\D/g, "").slice(0, 20); }

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { id } = await params;
  const data = await request.formData();
  const name = String(data.get("name") || "").trim().slice(0, 120);
  const sellerPhone = phone(String(data.get("phone") || ""));
  const commissionRate = Math.max(0, Math.min(100, Number(data.get("commissionRate") || 5)));
  const active = String(data.get("active") || "") === "on";
  if (!name || !sellerPhone) return NextResponse.redirect(new URL("/admin/vendedores?error=invalid", request.url), 303);
  const db = getDatabase();
  await db.sql`UPDATE sellers SET name=${name}, phone=${sellerPhone}, commission_rate=${commissionRate}, active=${active}, updated_at=NOW() WHERE id=${id}`;
  return NextResponse.redirect(new URL("/admin/vendedores", request.url), 303);
}
