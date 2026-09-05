import { getDatabase } from "@netlify/database";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const data = await request.formData();
  const name = String(data.get("name") || "").trim();
  const category = String(data.get("category") || "").trim();
  const price = Number(String(data.get("price") || "0").replace(",", "."));
  if (!name || !category || !Number.isFinite(price) || price < 0) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const id = `${slugify(name)}-${Date.now()}`;
  const slug = `${slugify(name)}-${Date.now().toString().slice(-6)}`;
  const db = getDatabase();
  await db.sql`INSERT INTO products (id, name, slug, category, price, description, warranty, stock_status, featured, badge, image) VALUES (${id}, ${name}, ${slug}, ${category}, ${price}, ${String(data.get("description") || "")}, ${String(data.get("warranty") || "") || null}, ${String(data.get("stockStatus") || "em_estoque")}, ${data.get("featured") === "on"}, ${String(data.get("badge") || "") || null}, ${String(data.get("image") || "") || null})`;
  return NextResponse.redirect(new URL("/admin?created=1", request.url), 303);
}

export async function DELETE(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });
  const db = getDatabase();
  await db.sql`DELETE FROM products WHERE id = ${String(id)}`;
  return NextResponse.json({ ok: true });
}
