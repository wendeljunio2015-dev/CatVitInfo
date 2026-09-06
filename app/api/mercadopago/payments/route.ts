import { getDatabase } from "@netlify/database";
import { NextResponse } from "next/server";
import { getAuthenticatedCustomerId } from "@/lib/customer-auth";
import { getSellerRef } from "@/lib/seller-ref";
import { reconcileMercadoPagoPayment, type MercadoPagoPayment } from "@/lib/mercadopago-payment";

const storeWhatsApp = "5562994780830";
const webhookUrl = "https://catvitinfo.netlify.app/api/mercadopago/webhook";

type RequestedItem = { productId?: string; quantity?: number };
type PaymentFormData = {
  token?: string;
  issuer_id?: string | number;
  payment_method_id?: string;
  payment_type_id?: string;
  transaction_amount?: number;
  installments?: number;
  payer?: {
    email?: string;
    identification?: { type?: string; number?: string };
  };
};

function makeOrderNumber() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = crypto.randomUUID().slice(0, 6).toUpperCase();
  return `VI-${date}-${suffix}`;
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, "").slice(0, 20);
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase().slice(0, 180);
}

export async function POST(request: Request) {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) return NextResponse.json({ error: "Mercado Pago não configurado." }, { status: 503 });

  try {
    const body = await request.json();
    const formData = (body.formData || {}) as PaymentFormData;
    const requestedItems = Array.isArray(body.items) ? (body.items as RequestedItem[]) : [];
    let customerName = String(body.customerName || "").trim().slice(0, 120);
    let customerPhone = normalizePhone(String(body.customerPhone || ""));
    let customerEmail = normalizeEmail(String(body.customerEmail || formData.payer?.email || ""));

    if (!customerName) return NextResponse.json({ error: "Informe seu nome para continuar com o pagamento." }, { status: 400 });
    if (customerPhone.length < 10) return NextResponse.json({ error: "Informe um WhatsApp válido para continuar com o pagamento." }, { status: 400 });
    if (!customerEmail || !customerEmail.includes("@")) return NextResponse.json({ error: "Informe um e-mail válido para continuar com o pagamento." }, { status: 400 });

    const paymentMethodId = String(formData.payment_method_id || "").trim();
    if (!paymentMethodId) return NextResponse.json({ error: "Selecione uma forma de pagamento." }, { status: 400 });

    const normalized = requestedItems
      .map((item) => ({
        productId: String(item.productId || "").trim(),
        quantity: Math.max(1, Math.min(99, Number(item.quantity) || 1)),
      }))
      .filter((item) => item.productId);
    if (!normalized.length) return NextResponse.json({ error: "Carrinho vazio." }, { status: 400 });

    const db = getDatabase();
    const ids = normalized.map((item) => item.productId);
    const rows = await db.sql`SELECT id, name, price, cost_price, stock_quantity FROM products WHERE id = ANY(${ids}::text[])`;
    const productMap = new Map(rows.map((row: any) => [String(row.id), row]));
    const items = [] as Array<{
      productId: string;
      name: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
      unitCost: number | null;
      costSubtotal: number | null;
    }>;

    for (const requested of normalized) {
      const product = productMap.get(requested.productId) as any;
      if (!product) return NextResponse.json({ error: "Um produto do carrinho não está mais disponível no catálogo." }, { status: 409 });
      const available = Number(product.stock_quantity ?? 0);
      if (available <= 0) return NextResponse.json({ error: `${String(product.name)} está indisponível no momento.` }, { status: 409 });
      if (requested.quantity > available) return NextResponse.json({ error: `${String(product.name)} possui apenas ${available} unidade(s) disponível(is).` }, { status: 409 });
      const unitPrice = Number(product.price);
      const unitCost = product.cost_price == null ? null : Number(product.cost_price);
      items.push({
        productId: requested.productId,
        name: String(product.name),
        quantity: requested.quantity,
        unitPrice,
        subtotal: unitPrice * requested.quantity,
        unitCost,
        costSubtotal: unitCost == null ? null : unitCost * requested.quantity,
      });
    }

    let customerId = await getAuthenticatedCustomerId();
    if (customerId) {
      const logged = await db.sql`SELECT id,name,phone,email FROM customers WHERE id=${customerId} LIMIT 1`;
      if (logged.length) {
        customerName = String(logged[0].name || customerName);
        customerPhone = logged[0].phone ? String(logged[0].phone) : customerPhone;
        customerEmail = logged[0].email ? String(logged[0].email) : customerEmail;
      } else customerId = null;
    }

    if (!customerId) {
      const existing = await db.sql`SELECT id FROM customers WHERE phone=${customerPhone} LIMIT 1`;
      if (existing.length) {
        customerId = String(existing[0].id);
        await db.sql`UPDATE customers SET name=${customerName}, email=${customerEmail}, updated_at=NOW() WHERE id=${customerId}`;
      } else {
        customerId = crypto.randomUUID();
        await db.sql`INSERT INTO customers (id,name,phone,email,city) VALUES (${customerId},${customerName},${customerPhone},${customerEmail},'Goiânia - GO')`;
      }
    }

    let sellerId: string | null = null;
    let sellerName: string | null = null;
    let sellerCommissionRate: number | null = null;
    let whatsappNumber = storeWhatsApp;
    const sellerRef = await getSellerRef();
    if (sellerRef) {
      const sellerRows = await db.sql`SELECT id,name,phone,commission_rate FROM sellers WHERE id=${sellerRef} AND active=TRUE LIMIT 1`;
      if (sellerRows.length) {
        sellerId = String(sellerRows[0].id);
        sellerName = String(sellerRows[0].name);
        sellerCommissionRate = Number(sellerRows[0].commission_rate);
        whatsappNumber = String(sellerRows[0].phone || storeWhatsApp).replace(/\D/g, "");
      }
    }

    const total = Math.round(items.reduce((sum, item) => sum + item.subtotal, 0) * 100) / 100;
    const id = crypto.randomUUID();
    const orderNumber = makeOrderNumber();
    await db.sql`
      INSERT INTO orders (
        id, order_number, customer_id, customer_name, items, total, status, source,
        seller_id, seller_name, seller_commission_rate, payment_provider, payment_status,
        payment_external_reference
      ) VALUES (
        ${id}, ${orderNumber}, ${customerId}, ${customerName}, ${JSON.stringify(items)}::jsonb, ${total},
        'novo', 'mercado_pago', ${sellerId}, ${sellerName}, ${sellerCommissionRate},
        'mercado_pago', 'creating', ${id}
      )
    `;

    const payer = {
      email: customerEmail,
      identification: formData.payer?.identification?.number
        ? {
            type: String(formData.payer.identification.type || "CPF"),
            number: String(formData.payer.identification.number),
          }
        : undefined,
    };

    const paymentPayload: Record<string, unknown> = {
      transaction_amount: total,
      description: `Vitória Informática - ${orderNumber}`,
      payment_method_id: paymentMethodId,
      payer,
      external_reference: id,
      notification_url: webhookUrl,
      additional_info: {
        items: items.map((item) => ({
          id: item.productId,
          title: item.name,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          category_id: "electronics",
        })),
        payer: { first_name: customerName, phone: { number: customerPhone } },
      },
    };

    if (formData.token) paymentPayload.token = formData.token;
    if (formData.issuer_id) paymentPayload.issuer_id = String(formData.issuer_id);
    if (formData.installments) paymentPayload.installments = Math.max(1, Math.min(12, Number(formData.installments) || 1));
    if (["credit_card", "debit_card", "prepaid_card"].includes(String(formData.payment_type_id || ""))) {
      paymentPayload.three_d_secure_mode = "optional";
    }

    const paymentResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": id,
      },
      body: JSON.stringify(paymentPayload),
      cache: "no-store",
    });

    const payment = (await paymentResponse.json()) as MercadoPagoPayment & { message?: string; error?: string };
    if (!paymentResponse.ok || !payment.id) {
      await db.sql`UPDATE orders SET payment_status='error', updated_at=NOW() WHERE id=${id}`;
      const mpMessage = String(payment.message || payment.error || "").trim();
      return NextResponse.json({ error: mpMessage || "O Mercado Pago não conseguiu criar o pagamento." }, { status: paymentResponse.status >= 400 && paymentResponse.status < 500 ? 400 : 502 });
    }

    const reconciliation = await reconcileMercadoPagoPayment(payment);
    const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
    const lines = [
      `Olá! Compra ${orderNumber} realizada pelo catálogo da Vitória Informática.`,
      sellerName ? `Atendimento: ${sellerName}` : "",
      `Cliente: ${customerName}`,
      `WhatsApp: ${customerPhone}`,
      "",
      ...items.map((item) => `• ${item.quantity}x ${item.name} — ${money.format(item.subtotal)}`),
      "",
      `Total: ${money.format(total)}`,
      `Pagamento Mercado Pago: ${String(payment.status || "em processamento")}`,
      `ID do pagamento: ${String(payment.id)}`,
    ].filter(Boolean);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(lines.join("\n"))}`;

    return NextResponse.json({
      ok: true,
      orderId: id,
      orderNumber,
      paymentId: String(payment.id),
      status: payment.status || null,
      statusDetail: payment.status_detail || null,
      threeDsInfo: payment.three_ds_info || null,
      whatsappUrl,
      approved: reconciliation.approved,
      stockDeducted: reconciliation.stockDeducted,
    });
  } catch (error) {
    console.error("Mercado Pago payment error", error);
    const message = error instanceof Error ? error.message : "Não foi possível processar o pagamento.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
