import { NextResponse } from "next/server";
import { syncMercadoPagoPayment } from "@/lib/mercado-pago-sync";

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
    if (!String(payment.external_reference || "").trim()) return NextResponse.json({ ok: true });

    await syncMercadoPagoPayment(payment);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
