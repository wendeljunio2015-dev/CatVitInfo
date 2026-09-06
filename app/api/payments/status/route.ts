import { getDatabase } from "@netlify/database";
import { NextResponse } from "next/server";

function normalizeItems(raw: unknown) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return []; }
  }
  return [];
}

function buildWhatsAppUrl(order: any, payment: any) {
  const storeWhatsApp = "5562994780830";
  const whatsappNumber = String(order.seller_phone || storeWhatsApp).replace(/\D/g, "") || storeWhatsApp;
  const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const items = normalizeItems(order.items) as Array<any>;
  const paymentMethod = payment.payment_method_id === "pix" ? "Pix" : `Cartão (${payment.payment_method_id || "Mercado Pago"})`;
  const installments = Number(payment.installments || 1);
  const lines = [
    "✅ COMPRA CONFIRMADA — Vitória Informática",
    `Pedido: ${order.order_number}`,
    order.seller_name ? `Vendedor: ${order.seller_name}` : "",
    order.customer_name ? `Cliente: ${order.customer_name}` : "",
    order.customer_phone ? `WhatsApp do cliente: ${order.customer_phone}` : "",
    "",
    ...items.map((item) => `• ${Number(item.quantity || 1)}x ${String(item.name || "Produto")} — ${money.format(Number(item.subtotal || 0))}`),
    "",
    `Total pago: ${money.format(Number(order.total || 0))}`,
    `Pagamento: ${paymentMethod}`,
    payment.payment_method_id !== "pix" ? `Parcelas: ${installments}x` : "",
    "Status: APROVADO",
    `ID Mercado Pago: ${payment.id}`,
    "",
    "Favor separar os produtos e confirmar retirada/entrega com o cliente.",
  ].filter(Boolean);
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(lines.join("\n"))}`;
}

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

export async function GET(request: Request) {
  try {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!accessToken) return NextResponse.json({ error: "Mercado Pago não configurado." }, { status: 503 });

    const url = new URL(request.url);
    const paymentId = url.searchParams.get("paymentId") || "";
    const orderId = url.searchParams.get("orderId") || "";
    if (!/^\d+$/.test(paymentId) || !orderId) return NextResponse.json({ error: "Consulta inválida." }, { status: 400 });

    const db = getDatabase();
    const rows = await db.sql`
      SELECT o.id,o.order_number,o.customer_name,o.items,o.total,o.seller_name,
             c.phone AS customer_phone,
             COALESCE(s.phone,'5562994780830') AS seller_phone
      FROM orders o
      LEFT JOIN customers c ON c.id=o.customer_id
      LEFT JOIN sellers s ON s.id=o.seller_id
      WHERE o.id=${orderId}
      LIMIT 1`;
    if (!rows.length) return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
    const order: any = rows[0];

    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    const payment: any = await mpResponse.json();
    if (!mpResponse.ok) return NextResponse.json({ error: payment?.message || "Pagamento não encontrado." }, { status: 404 });
    if (String(payment.external_reference || "") !== String(order.order_number)) return NextResponse.json({ error: "Pagamento não pertence a este pedido." }, { status: 403 });

    await savePayment(db, orderId, payment);

    let orderStatus = "aguardando_pagamento";
    if (payment.status === "approved") orderStatus = "pago";
    else if (payment.status === "rejected") orderStatus = "pagamento_recusado";
    else if (["cancelled", "refunded", "charged_back"].includes(String(payment.status))) orderStatus = String(payment.status);
    await db.sql`UPDATE orders SET status=${orderStatus}, source='mercado_pago', updated_at=NOW() WHERE id=${orderId}`;

    return NextResponse.json({
      paymentId: payment.id,
      status: payment.status,
      statusDetail: payment.status_detail,
      whatsappUrl: payment.status === "approved" ? buildWhatsAppUrl(order, payment) : undefined,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao consultar pagamento.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
