import { getDatabase } from "@netlify/database";
import { NextResponse } from "next/server";

async function savePayment(db: ReturnType<typeof getDatabase>, orderId: string, payment: any) {
  const providerPaymentId = String(payment.id || "");
  if (!providerPaymentId) return;
  const recordId = `mercado_pago:${providerPaymentId}`;
  const status = String(payment.status || "unknown");
  const statusDetail = payment.status_detail ? String(payment.status_detail) : null;
  const paymentMethod = payment.payment_method_id ? String(payment.payment_method_id) : null;
  const installments = Number.isFinite(Number(payment.installments)) ? Number(payment.installments) : null;
  const amount = Number(payment.transaction_amount || 0);
  const currency = String(payment.currency_id || "BRL");
  const approvedAt = payment.date_approved ? new Date(payment.date_approved).toISOString() : null;

  await db.sql`
    INSERT INTO payments (
      id, order_id, provider, provider_payment_id, status, status_detail,
      payment_method, installments, amount, currency, approved_at, updated_at
    ) VALUES (
      ${recordId}, ${orderId}, 'mercado_pago', ${providerPaymentId}, ${status}, ${statusDetail},
      ${paymentMethod}, ${installments}, ${amount}, ${currency}, ${approvedAt}, NOW()
    )
    ON CONFLICT (provider, provider_payment_id) DO UPDATE SET
      order_id = EXCLUDED.order_id,
      status = EXCLUDED.status,
      status_detail = EXCLUDED.status_detail,
      payment_method = EXCLUDED.payment_method,
      installments = EXCLUDED.installments,
      amount = EXCLUDED.amount,
      currency = EXCLUDED.currency,
      approved_at = EXCLUDED.approved_at,
      updated_at = NOW()`;
}

export async function POST(request: Request) {
  try {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!accessToken) return NextResponse.json({ ok: true });

    const url = new URL(request.url);
    const body = await request.json().catch(() => ({}));
    const type = String(body?.type || url.searchParams.get("type") || "");
    const paymentId = String(body?.data?.id || url.searchParams.get("data.id") || "");
    if (type && type !== "payment") return NextResponse.json({ ok: true });
    if (!/^\d+$/.test(paymentId)) return NextResponse.json({ ok: true });

    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!mpResponse.ok) return NextResponse.json({ ok: true });
    const payment: any = await mpResponse.json();
    const orderNumber = String(payment.external_reference || "").trim();
    if (!orderNumber) return NextResponse.json({ ok: true });

    let orderStatus = "aguardando_pagamento";
    if (payment.status === "approved") orderStatus = "pago";
    else if (payment.status === "rejected") orderStatus = "pagamento_recusado";
    else if (["cancelled", "refunded", "charged_back"].includes(String(payment.status))) orderStatus = String(payment.status);

    const db = getDatabase();
    const orders = await db.sql`SELECT id FROM orders WHERE order_number=${orderNumber} LIMIT 1`;
    if (!orders.length) return NextResponse.json({ ok: true });
    const orderId = String(orders[0].id);

    await savePayment(db, orderId, payment);
    await db.sql`UPDATE orders SET status=${orderStatus}, source='mercado_pago', updated_at=NOW() WHERE id=${orderId}`;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
