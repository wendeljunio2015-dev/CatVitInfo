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
    "Status: APROVADO",
    `ID Mercado Pago: ${payment.id}`,
    "",
    "Favor separar os produtos e confirmar retirada/entrega com o cliente.",
  ].filter(Boolean);
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(lines.join("\n"))}`;
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
      SELECT o.id,o.order_number,o.customer_name,o.customer_phone,o.items,o.total,o.seller_name,
             COALESCE(s.phone,'5562994780830') AS seller_phone
      FROM orders o
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

    let orderStatus = "aguardando_pagamento";
    if (payment.status === "approved") orderStatus = "pago";
    else if (payment.status === "rejected") orderStatus = "pagamento_recusado";
    else if (["cancelled", "refunded", "charged_back"].includes(String(payment.status))) orderStatus = String(payment.status);
    await db.sql`UPDATE orders SET status=${orderStatus}, source='mercado_pago' WHERE id=${orderId}`;

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
