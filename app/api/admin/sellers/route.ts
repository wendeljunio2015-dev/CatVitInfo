import { getDatabase } from "@netlify/database";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";

function slugify(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60); }
function phone(value: string) { return value.replace(/\D/g, "").slice(0, 20); }

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const data = await request.formData();
  const name = String(data.get("name") || "").trim().slice(0, 120);
  const sellerPhone = phone(String(data.get("phone") || ""));
  const commissionRate = Math.max(0, Math.min(100, Number(data.get("commissionRate") || 5)));
  if (!name || !sellerPhone) return NextResponse.redirect(new URL("/admin/vendedores?error=invalid", request.url), 303);
  const db = getDatabase();
  const base = slugify(name) || `vendedor-${crypto.randomUUID().slice(0, 6)}`;
  let slug = base;
  let suffix = 2;
  while ((await db.sql`SELECT id FROM sellers WHERE slug=${slug} LIMIT 1`).length) slug = `${base}-${suffix++}`;
  await db.sql`INSERT INTO sellers (id,name,slug,phone,commission_rate,active) VALUES (${crypto.randomUUID()},${name},${slug},${sellerPhone},${commissionRate},TRUE)`;
  return NextResponse.redirect(new URL("/admin/vendedores", request.url), 303);
}
