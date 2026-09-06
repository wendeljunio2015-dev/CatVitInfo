import { createHmac, timingSafeEqual } from "node:crypto";
import { getDatabase } from "@netlify/database";
import { NextResponse } from "next/server";

type MercadoPagoNotification = {
  type?: string;
  action?: string;
  data?: { id?: string | number };
};

type MercadoPagoPayment = {
  id?: string | number;
  status?: string;
  status_detail?: string;
  payment_method_id?: string;
  payment_type_id?: string;
  external_reference?: string | null;
  transaction_amount?: number;
  date_approved?: string | null;
  date_last_updated?: string | null;
};

function parseSignature(value: string | null) {
  const parts = String(value || "").split(",");
  let ts = "";
  let v1 = "";

  for (const part of parts) {
    const [key, rawValue] = part.split("=", 2);
    if (!key || !rawValue) continue;
    const normalizedKey = key.trim();
    const normalizedValue = rawValue.trim();
    if (normalizedKey === "ts") ts = normalizedValue;
    if (normalizedKey === "v1") v1 = normalizedValue;
  }

  return { ts, v1 };
}

function validateSignature(request: Request, dataId: string, secret: string) {
  const xSignature = request.headers.get("x-signature");
  const xRequestId = request.headers.get("x-request-id") || "";
  const { ts, v1 } = parseSignature(xSignature);
  if (!ts || !v1) return false;

  const normalizedDataId = /^[a-z0-9]+$/i.test(dataId) ? dataId.toLowerCase() : dataId;
  const manifestParts = [];
  if (normalizedDataId) manifestParts.push(`id:${normalizedDataId};`);
  if (xRequestId) manifestParts.push(`request-id:${xRequestId};`);
  if (ts) manifestParts.push(`ts:${ts};`);
  const manifest = manifestParts.join("");

  const expected = createHmac("sha256", secret).update(manifest).digest("hex");
  if (expected.length !== v1.length) return false;
  return timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(v1, "utf8"));
}

async function fetchPayment(paymentId: string, accessToken: string) {
  const response = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) throw new Error(`Mercado Pago payment lookup failed (${response.status})`);
  return response.json() as Promise<MercadoPagoPayment>;
}

export async function POST(request: Request) {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!secret || !accessToken) {
    return NextResponse.json({ error: "Mercado Pago não configurado" }, { status: 503 });
  }

  let body: MercadoPagoNotification;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const url = new URL(request.url);
  const queryDataId = url.searchParams.get("data.id") || "";
  const bodyDataId = body.data?.id == null ? "" : String(body.data.id);
  const paymentId = queryDataId || bodyDataId;

  if (!paymentId) return NextResponse.json({ error: "Pagamento não informado" }, { status: 400 });
  if (!validateSignature(request, queryDataId, secret)) {
    return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 });
  }

  if (body.type && body.type !== "payment") {
    return NextResponse.json({ ok: true, ignored: true });
  }

  try {
    const payment = await fetchPayment(paymentId, accessToken);
    const externalReference = String(payment.external_reference || "").trim();
    if (!externalReference) return NextResponse.json({ ok: true, ignored: true, reason: "missing_external_reference" });

    const db = getDatabase();
    const paymentIdValue = String(payment.id || paymentId);
    const paymentAmount = Number(payment.transaction_amount || 0);

    await db.sql`
      UPDATE orders
      SET payment_provider = 'mercado_pago',
          payment_id = ${paymentIdValue},
          payment_status = ${String(payment.status || "") || null},
          payment_status_detail = ${String(payment.status_detail || "") || null},
          payment_method_id = ${String(payment.payment_method_id || "") || null},
          payment_type_id = ${String(payment.payment_type_id || "") || null},
          payment_external_reference = ${externalReference},
          payment_amount = ${Number.isFinite(paymentAmount) ? paymentAmount : null},
          payment_approved_at = ${payment.date_approved || null},
          payment_updated_at = ${payment.date_last_updated || new Date().toISOString()},
          updated_at = NOW()
      WHERE id = ${externalReference} OR order_number = ${externalReference}
    `;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Mercado Pago webhook error", error);
    return NextResponse.json({ error: "Falha ao processar notificação" }, { status: 500 });
  }
}
