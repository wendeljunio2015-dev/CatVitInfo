import { getDatabase } from "@netlify/database";
import { NextResponse } from "next/server";

const storeWhatsApp = "5562994780830";

export async function GET(request: Request) {
  const orderId = new URL(request.url).searchParams.get("orderId")?.trim();
  if (!orderId) return NextResponse.json({ error: "Pedido não informado." }, { status: 400 });

  const db = getDatabase();
  const rows = await db.sql`
    SELECT o.id, o.order_number, o.customer_name, o.items, o.total, o.status,
           o.payment_status, o.payment_status_detail, o.payment_id,
           o.stock_deducted_at, o.seller_id, o.seller_name, s.phone AS seller_phone
    FROM orders o
    LEFT JOIN sellers s ON s.id = o.seller_id AND s.active = TRUE
    WHERE o.id = ${orderId}
    LIMIT 1
  `;

  if (!rows.length) return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  const order = rows[0] as any;
  const whatsappNumber = String(order.seller_phone || storeWhatsApp).replace(/\D/g, "");
  const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const items = Array.isArray(order.items) ? order.items : [];
  const lines = [
    `Olá! Compra ${String(order.order_number)} realizada pelo catálogo da Vitória Informática.`,
    order.seller_name ? `Atendimento: ${String(order.seller_name)}` : "",
    order.customer_name ? `Cliente: ${String(order.customer_name)}` : "",
    "",
    ...items.map((item: any) => `• ${Math.max(1, Number(item.quantity) || 1)}x ${String(item.name || "Produto")} — ${money.format(Number(item.subtotal || 0))}`),
    "",
    `Total: ${money.format(Number(order.total || 0))}`,
    `Pagamento Mercado Pago: ${String(order.payment_status || "em processamento")}`,
    order.payment_id ? `ID do pagamento: ${String(order.payment_id)}` : "",
  ].filter(Boolean);

  return NextResponse.json({
    ok: true,
    orderId: String(order.id),
    orderNumber: String(order.order_number),
    orderStatus: String(order.status),
    paymentStatus: order.payment_status ? String(order.payment_status) : null,
    paymentStatusDetail: order.payment_status_detail ? String(order.payment_status_detail) : null,
    paymentId: order.payment_id ? String(order.payment_id) : null,
    approved: String(order.payment_status || "") === "approved",
    stockDeducted: Boolean(order.stock_deducted_at),
    whatsappUrl: `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(lines.join("\n"))}`,
  });
}
