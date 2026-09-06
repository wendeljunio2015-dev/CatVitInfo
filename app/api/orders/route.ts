import { getDatabase } from "@netlify/database";
import { NextResponse } from "next/server";
import { getAuthenticatedCustomerId } from "@/lib/customer-auth";
import { getSellerRef } from "@/lib/seller-ref";

const storeWhatsApp = "5562994780830";
type RequestedItem = { productId?: string; quantity?: number };

function makeOrderNumber() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = crypto.randomUUID().slice(0, 6).toUpperCase();
  return `VI-${date}-${suffix}`;
}

function normalizePhone(value: string) { return value.replace(/\D/g, "").slice(0, 20); }

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const requestedItems = Array.isArray(body.items) ? (body.items as RequestedItem[]) : [];
    const channel = body.channel === "mercado_pago" ? "mercado_pago" : "whatsapp";
    let customerName = String(body.customerName || "").trim().slice(0, 120) || null;
    let customerPhone = normalizePhone(String(body.customerPhone || "")) || null;
    let customerEmail = String(body.customerEmail || "").trim().toLowerCase().slice(0, 180) || null;

    const normalized = requestedItems.map((item) => ({ productId: String(item.productId || "").trim(), quantity: Math.max(1, Math.min(99, Number(item.quantity) || 1)) })).filter((item) => item.productId);
    if (!normalized.length) return NextResponse.json({ error: "Carrinho vazio" }, { status: 400 });
    if (channel === "mercado_pago" && (!customerName || !customerPhone || !customerEmail)) return NextResponse.json({ error: "Para pagar online, informe nome, WhatsApp e e-mail." }, { status: 400 });

    const db = getDatabase();
    const ids = normalized.map((item) => item.productId);
    const rows = await db.sql`SELECT id, name, price, cost_price, stock_quantity FROM products WHERE id = ANY(${ids}::text[])`;
    const productMap = new Map(rows.map((row: any) => [String(row.id), row]));
    const items = [] as Array<{ productId: string; name: string; quantity: number; unitPrice: number; subtotal: number; unitCost: number | null; costSubtotal: number | null }>;
    for (const requested of normalized) {
      const product = productMap.get(requested.productId) as any;
      if (!product) return NextResponse.json({ error: "Um produto do carrinho não está mais disponível no catálogo. Remova-o e tente novamente." }, { status: 409 });
      const available = Number(product.stock_quantity ?? 0);
      if (available <= 0) return NextResponse.json({ error: `${String(product.name)} está indisponível no momento. Remova o item do carrinho.` }, { status: 409 });
      if (requested.quantity > available) return NextResponse.json({ error: `${String(product.name)} possui apenas ${available} unidade(s) disponível(is). Ajuste a quantidade no carrinho.` }, { status: 409 });
      const unitPrice = Number(product.price);
      const unitCost = product.cost_price == null ? null : Number(product.cost_price);
      items.push({ productId: requested.productId, name: String(product.name), quantity: requested.quantity, unitPrice, subtotal: unitPrice * requested.quantity, unitCost, costSubtotal: unitCost == null ? null : unitCost * requested.quantity });
    }

    let customerId = await getAuthenticatedCustomerId();
    if (customerId) {
      const logged = await db.sql`SELECT id,name,phone,email FROM customers WHERE id=${customerId} LIMIT 1`;
      if (logged.length) { customerName = String(logged[0].name || customerName || "Cliente"); customerPhone = logged[0].phone ? String(logged[0].phone) : customerPhone; customerEmail = logged[0].email ? String(logged[0].email) : customerEmail; } else customerId = null;
    }
    if (!customerId && customerName && customerPhone) {
      const existing = await db.sql`SELECT id FROM customers WHERE phone=${customerPhone} LIMIT 1`;
      if (existing.length) { customerId = String(existing[0].id); await db.sql`UPDATE customers SET name=${customerName}, email=COALESCE(${customerEmail}, email), updated_at=NOW() WHERE id=${customerId}`; }
      else { customerId = crypto.randomUUID(); await db.sql`INSERT INTO customers (id,name,phone,email,city) VALUES (${customerId},${customerName},${customerPhone},${customerEmail},'Goiânia - GO')`; }
    }

    let sellerId: string | null = null; let sellerName: string | null = null; let sellerCommissionRate: number | null = null; let whatsappNumber = storeWhatsApp;
    const sellerRef = await getSellerRef();
    if (sellerRef) {
      const sellerRows = await db.sql`SELECT id,name,phone,commission_rate FROM sellers WHERE id=${sellerRef} AND active=TRUE LIMIT 1`;
      if (sellerRows.length) { sellerId = String(sellerRows[0].id); sellerName = String(sellerRows[0].name); sellerCommissionRate = Number(sellerRows[0].commission_rate); whatsappNumber = String(sellerRows[0].phone || storeWhatsApp).replace(/\D/g, ""); }
    }

    const total = items.reduce((sum, item) => sum + item.subtotal, 0);
    const id = crypto.randomUUID(); const orderNumber = makeOrderNumber(); const initialStatus = channel === "mercado_pago" ? "aguardando_pagamento" : "novo";
    await db.sql`INSERT INTO orders (id,order_number,customer_id,customer_name,items,total,status,source,seller_id,seller_name,seller_commission_rate) VALUES (${id},${orderNumber},${customerId},${customerName},${JSON.stringify(items)}::jsonb,${total},${initialStatus},${channel},${sellerId},${sellerName},${sellerCommissionRate})`;

    const money = new Intl.NumberFormat("pt-BR", { style:"currency", currency:"BRL" });
    const lines = [
      `Olá! Gostaria de solicitar somente um orçamento (${orderNumber}) na Vitória Informática.`,
      sellerName ? `Atendimento: ${sellerName}` : "",
      customerName ? `Cliente: ${customerName}` : "",
      customerPhone ? `WhatsApp: ${customerPhone}` : "",
      "",
      ...items.map((item) => `• ${item.quantity}x ${item.name} — ${money.format(item.subtotal)}`),
      "",
      `Total atual do carrinho: ${money.format(total)}`,
      "",
      "Este pedido é somente para orçamento e não confirma a compra.",
      "Gostaria de verificar desconto por quantidade e outras condições comerciais.",
      "Por favor, confirme disponibilidade, valor negociado e condições de retirada/entrega em Goiânia.",
    ].filter(Boolean);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(lines.join("\n"))}`;
    return NextResponse.json({ ok:true, id, orderNumber, total, customerId, sellerId, channel, whatsappUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível registrar o pedido.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
