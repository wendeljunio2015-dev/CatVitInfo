import { getDatabase } from "@netlify/database";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";

function normalizePhone(value: string) {
  return value.replace(/\D/g, "").slice(0, 20);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const { id } = await params;
    const data = await request.formData();
    const name = String(data.get("name") || "").trim().slice(0, 120);
    const phone = normalizePhone(String(data.get("phone") || "")) || null;
    const email = String(data.get("email") || "").trim().toLowerCase().slice(0, 180) || null;
    const document = String(data.get("document") || "").trim().slice(0, 30) || null;
    const city = String(data.get("city") || "").trim().slice(0, 120) || null;
    const notes = String(data.get("notes") || "").trim().slice(0, 2000) || null;
    if (!name) return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });

    const db = getDatabase();
    await db.sql`
      UPDATE customers
      SET name = ${name}, phone = ${phone}, email = ${email}, document = ${document}, city = ${city}, notes = ${notes}, updated_at = NOW()
      WHERE id = ${id}
    `;
    return NextResponse.redirect(new URL(`/admin/clientes/${encodeURIComponent(id)}/editar?saved=1`, request.url), 303);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível atualizar o cliente.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
