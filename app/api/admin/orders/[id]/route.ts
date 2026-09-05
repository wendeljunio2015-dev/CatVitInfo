import { getDatabase } from "@netlify/database";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  const data = await request.formData();
  const status = String(data.get("status") || "");
  if (!["novo", "em_atendimento", "concluido", "cancelado"].includes(status)) {
    return NextResponse.json({ error: "Status inválido" }, { status: 400 });
  }

  const db = getDatabase();
  await db.sql`UPDATE orders SET status = ${status}, updated_at = NOW() WHERE id = ${id}`;
  return NextResponse.redirect(new URL("/admin/pedidos", request.url), 303);
}
