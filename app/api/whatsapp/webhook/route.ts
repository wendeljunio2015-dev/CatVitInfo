import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { recordWhatsAppMessageStatus } from "@/lib/whatsapp-cloud";

function validSignature(rawBody: string, signature: string | null, appSecret: string) {
  if (!signature?.startsWith("sha256=")) return false;
  const received = signature.slice("sha256=".length).trim();
  const expected = createHmac("sha256", appSecret).update(rawBody).digest("hex");
  if (received.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(received, "utf8"), Buffer.from(expected, "utf8"));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode") || "";
  const token = url.searchParams.get("hub.verify_token") || "";
  const challenge = url.searchParams.get("hub.challenge") || "";
  const verifyToken = String(process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || "");

  if (mode === "subscribe" && verifyToken && token === verifyToken) {
    return new Response(challenge, { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }

  return NextResponse.json({ error: "Verificação inválida" }, { status: 403 });
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const appSecret = String(process.env.META_APP_SECRET || "").trim();

  if (appSecret && !validSignature(rawBody, request.headers.get("x-hub-signature-256"), appSecret)) {
    return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 });
  }

  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  try {
    const entries = Array.isArray(body?.entry) ? body.entry : [];
    for (const entry of entries) {
      const changes = Array.isArray(entry?.changes) ? entry.changes : [];
      for (const change of changes) {
        if (change?.field !== "messages") continue;
        const statuses = Array.isArray(change?.value?.statuses) ? change.value.statuses : [];
        for (const item of statuses) {
          const providerMessageId = String(item?.id || "");
          const status = String(item?.status || "");
          const errors = Array.isArray(item?.errors) ? item.errors : [];
          const errorMessage = errors
            .map((error: any) => String(error?.error_data?.details || error?.message || error?.title || ""))
            .filter(Boolean)
            .join(" | ");
          await recordWhatsAppMessageStatus(providerMessageId, status, errorMessage || undefined);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("WhatsApp webhook processing error", error);
    return NextResponse.json({ error: "Falha ao processar webhook" }, { status: 500 });
  }
}
