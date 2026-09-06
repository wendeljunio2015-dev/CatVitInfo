import { getDatabase } from "@netlify/database";
import { NextResponse } from "next/server";
import { syncMercadoPagoPayment } from "@/lib/mercado-pago-sync";

function normalizeItems(raw: unknown) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return []; }
  }
  return [];
}

function buildWhatsAppUrl(order: any, payment: any, orderStatus?: string) {
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
    `Status: ${payment.status === "approved" ? "APROVADO" : String(payment.status || "em processamento").toUpperCase()}`,
    `ID Mercado Pago: ${payment.id}`,
    orderStatus === "pago_revisao_estoque" ? "⚠️ ATENÇÃO: pagamento aprovado, mas o estoque precisa de revisão manual." : "",
    "",
    "Favor separar os produtos e confirmar retirada/entrega com o cliente.",
  ].filter(Boolean);
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(lines.join("\n"))}`;
}

export async function POST(request: Request) {
  try {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!accessToken) return NextResponse.json({ error: "Mercado Pago ainda não está configurado no servidor." }, { status: 503 });

    const body = await request.json();
    const orderId = String(body.orderId || "").trim();
    const requestId = String(body.requestId || "").trim();
    const formData = body.formData && typeof body.formData === "object" ? body.formData : {};
    if (!orderId) return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
    if (!/^[0-9a-f-]{36}$/i.test(requestId)) return NextResponse.json({ error: "Identificador de pagamento inválido." }, { status: 400 });

    const db = getDatabase();
    const rows = await db.sql`
      SELECT o.id,o.order_number,o.customer_name,o.items,o.total,o.status,o.seller_id,o.seller_name,
             c.phone AS customer_phone,c.email AS customer_email,
             COALESCE(s.phone,'5562994780830') AS seller_phone
      FROM orders o
      LEFT JOIN customers c ON c.id=o.customer_id
      LEFT JOIN sellers s ON s.id=o.seller_id
      WHERE o.id=${orderId}
      LIMIT 1`;
    if (!rows.length) return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
    const order: any = rows[0];
    if (Number(order.total) <= 0) return NextResponse.json({ error: "Valor do pedido inválido." }, { status: 400 });
    if (["pago", "pago_revisao_estoque", "concluido", "cancelado", "refunded", "charged_back"].includes(String(order.status))) {
      return NextResponse.json({ error: "Este pedido não aceita um novo pagamento." }, { status: 409 });
    }

    const payer = formData.payer && typeof formData.payer === "object" ? formData.payer : {};
    const payload: Record<string, unknown> = {
      transaction_amount: Number(order.total),
      description: `Vitória Informática - ${order.order_number}`.slice(0, 255),
      external_reference: String(order.order_number),
      payment_method_id: formData.payment_method_id,
      token: formData.token,
      issuer_id: formData.issuer_id,
      installments: formData.installments,
      payer: { ...payer, email: (payer as any).email || order.customer_email || undefined },
      metadata: { order_id: order.id, order_number: order.order_number },
      three_d_secure_mode: "optional",
      binary_mode: false,
      capture: true,
    };
    Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key]);
    payload.notification_url = `${new URL(request.url).origin}/api/mercadopago/webhook`;

    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", "X-Idempotency-Key": requestId },
      body: JSON.stringify(payload),
    });
    const payment: any = await mpResponse.json();
    if (!mpResponse.ok) {
      const detail = payment?.message || payment?.cause?.[0]?.description || "Pagamento recusado pelo Mercado Pago.";
      return NextResponse.json({ error: detail }, { status: mpResponse.status >= 500 ? 502 : 400 });
    }

    const syncResult = await syncMercadoPagoPayment(payment, orderId);
    const result: Record<string, unknown> = { paymentId: payment.id, status: payment.status, statusDetail: payment.status_detail, orderStatus: syncResult.orderStatus };

    if (payment.status === "approved") result.whatsappUrl = buildWhatsAppUrl(order, payment, syncResult.orderStatus);
    if (payment.status_detail === "pending_challenge" && payment.three_ds_info) {
      result.threeDsInfo = { externalResourceURL: payment.three_ds_info.external_resource_url, creq: payment.three_ds_info.creq };
    }
    const transactionData = payment.point_of_interaction?.transaction_data;
    if (payment.payment_method_id === "pix" && transactionData) {
      result.pix = { qrCode: transactionData.qr_code, qrCodeBase64: transactionData.qr_code_base64, ticketUrl: transactionData.ticket_url };
    }

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível processar o pagamento.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
