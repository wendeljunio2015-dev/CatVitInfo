import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { queueAndSendApprovedOrderNotification } from "@/lib/whatsapp-cloud";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  try {
    const result = await queueAndSendApprovedOrderNotification(id);
    if (!result.queued) {
      const reason = result.reason === "order_not_approved"
        ? "A notificação automática só pode ser enviada depois que o pagamento Mercado Pago estiver aprovado e o estoque baixado."
        : "Não foi possível preparar a notificação do WhatsApp.";
      return NextResponse.redirect(new URL(`/admin/pedidos?error=${encodeURIComponent(reason)}`, request.url), 303);
    }
    return NextResponse.redirect(new URL("/admin/pedidos", request.url), 303);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível reenviar a notificação do WhatsApp.";
    return NextResponse.redirect(new URL(`/admin/pedidos?error=${encodeURIComponent(message)}`, request.url), 303);
  }
}
