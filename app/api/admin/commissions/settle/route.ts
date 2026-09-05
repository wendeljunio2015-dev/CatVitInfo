import { getDatabase } from "@netlify/database";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";

function parseMonth(value: string) {
  if (!/^\d{4}-\d{2}$/.test(value)) return null;
  const month = Number(value.slice(5, 7));
  if (month < 1 || month > 12) return null;
  return `${value}-01`;
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const data = await request.formData();
  const sellerId = String(data.get("sellerId") || "").trim();
  const monthValue = String(data.get("month") || "").trim();
  const periodMonth = parseMonth(monthValue);
  if (!sellerId || !periodMonth) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const db = getDatabase();
  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");
    const existing = await client.query(
      "SELECT id FROM commission_settlements WHERE seller_id=$1 AND period_month=$2::date FOR UPDATE",
      [sellerId, periodMonth],
    );
    if (existing.rows.length) {
      await client.query("ROLLBACK");
      return NextResponse.redirect(new URL(`/admin/comissoes?month=${encodeURIComponent(monthValue)}&error=paid`, request.url), 303);
    }

    const seller = await client.query("SELECT id,name FROM sellers WHERE id=$1 FOR UPDATE", [sellerId]);
    if (!seller.rows.length) {
      await client.query("ROLLBACK");
      return NextResponse.redirect(new URL(`/admin/comissoes?month=${encodeURIComponent(monthValue)}&error=seller`, request.url), 303);
    }

    const totals = await client.query(
      `SELECT COUNT(*)::int AS sales_count,
              COALESCE(SUM(total),0)::numeric AS sales_total,
              COALESCE(SUM(commission_amount),0)::numeric AS commission_total
       FROM orders
       WHERE seller_id=$1
         AND status='concluido'
         AND stock_deducted_at IS NOT NULL
         AND created_at >= $2::date
         AND created_at < ($2::date + INTERVAL '1 month')`,
      [sellerId, periodMonth],
    );
    const row = totals.rows[0];
    const commissionTotal = Number(row.commission_total || 0);
    if (commissionTotal <= 0) {
      await client.query("ROLLBACK");
      return NextResponse.redirect(new URL(`/admin/comissoes?month=${encodeURIComponent(monthValue)}&error=empty`, request.url), 303);
    }

    await client.query(
      `INSERT INTO commission_settlements
       (id,seller_id,period_month,sales_count,sales_total,commission_total,paid_amount,status)
       VALUES ($1,$2,$3::date,$4,$5,$6,$6,'pago')`,
      [crypto.randomUUID(), sellerId, periodMonth, Number(row.sales_count || 0), Number(row.sales_total || 0), commissionTotal],
    );

    await client.query("COMMIT");
    return NextResponse.redirect(new URL(`/admin/comissoes?month=${encodeURIComponent(monthValue)}&paid=1`, request.url), 303);
  } catch {
    await client.query("ROLLBACK");
    return NextResponse.redirect(new URL(`/admin/comissoes?month=${encodeURIComponent(monthValue)}&error=failed`, request.url), 303);
  } finally {
    client.release();
  }
}
