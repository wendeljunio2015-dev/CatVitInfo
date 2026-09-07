import { getDatabase } from "@netlify/database";

const notificationType = "payment_approved_seller";
const channel = "whatsapp";
const defaultStoreRecipient = "5562994780830";

type OrderItem = {
  name?: string;
  quantity?: number;
  subtotal?: number;
};

type NotificationRow = {
  id: string;
  order_id: string;
  recipient: string;
  status: string;
  attempts: number;
};

function digits(value: unknown) {
  return String(value || "").replace(/\D/g, "").slice(0, 20);
}

function truncate(value: string, max: number) {
  if (value.length <= max) return value;
  return `${value.slice(0, Math.max(0, max - 1))}…`;
}

function formatMoney(value: unknown) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));
}

function paymentLabel(methodId: unknown, typeId: unknown, installments: unknown) {
  const method = String(methodId || "").trim();
  const type = String(typeId || "").trim();
  const count = Math.max(1, Number(installments) || 1);
  if (method === "pix" || type === "bank_transfer") return "Pix à vista - aprovado";
  if (type === "credit_card") return count > 1 ? `Cartão de crédito em ${count}x - aprovado` : "Cartão de crédito à vista - aprovado";
  if (type === "debit_card") return "Cartão de débito à vista - aprovado";
  return method ? `${method}${count > 1 ? ` em ${count}x` : ""} - aprovado` : "Pagamento aprovado";
}

async function getApprovedOrder(orderId: string) {
  const db = getDatabase();
  const rows = await db.sql`
    SELECT o.id, o.order_number, o.customer_id, o.customer_name, o.items, o.total,
           o.payment_id, o.payment_status, o.payment_method_id, o.payment_type_id, o.payment_installments,
           o.stock_deducted_at, o.seller_id, o.seller_name,
           c.phone AS customer_phone, s.phone AS seller_phone
    FROM orders o
    LEFT JOIN customers c ON c.id = o.customer_id
    LEFT JOIN sellers s ON s.id = o.seller_id AND s.active = TRUE
    WHERE o.id = ${orderId}
    LIMIT 1
  `;

  if (!rows.length) return null;
  const order = rows[0] as any;
  if (String(order.payment_status || "") !== "approved" || !order.stock_deducted_at) return null;
  return order;
}

async function createPendingNotification(order: any) {
  const recipient = digits(order.seller_phone || process.env.WHATSAPP_STORE_RECIPIENT || defaultStoreRecipient);
  if (recipient.length < 10) return null;

  const items = Array.isArray(order.items) ? (order.items as OrderItem[]) : [];
  const itemSummary = truncate(
    items
      .map((item) => `${Math.max(1, Number(item.quantity) || 1)}x ${String(item.name || "Produto")}`)
      .join("; "),
    700,
  );
  const payload = {
    orderNumber: String(order.order_number),
    customerName: String(order.customer_name || "Cliente não informado"),
    customerPhone: digits(order.customer_phone) || "Não informado",
    items: itemSummary || "Itens do pedido",
    total: formatMoney(order.total),
    payment: paymentLabel(order.payment_method_id, order.payment_type_id, order.payment_installments),
    paymentId: String(order.payment_id || "Não informado"),
    sellerName: order.seller_name ? String(order.seller_name) : null,
  };

  const db = getDatabase();
  const id = crypto.randomUUID();
  const templateName = String(process.env.WHATSAPP_SELLER_TEMPLATE_NAME || "").trim() || null;
  const templateLanguage = String(process.env.WHATSAPP_SELLER_TEMPLATE_LANGUAGE || "pt_BR").trim() || "pt_BR";

  await db.sql`
    INSERT INTO order_notifications (
      id, order_id, channel, notification_type, recipient, template_name, template_language,
      status, payload
    ) VALUES (
      ${id}, ${String(order.id)}, ${channel}, ${notificationType}, ${recipient}, ${templateName},
      ${templateLanguage}, 'pending', ${JSON.stringify(payload)}::jsonb
    )
    ON CONFLICT (order_id, channel, notification_type) DO NOTHING
  `;

  const rows = await db.sql`
    SELECT id, order_id, recipient, status, attempts
    FROM order_notifications
    WHERE order_id = ${String(order.id)} AND channel = ${channel} AND notification_type = ${notificationType}
    LIMIT 1
  `;
  return rows.length ? (rows[0] as NotificationRow) : null;
}

async function markFailed(id: string, message: string) {
  const db = getDatabase();
  await db.sql`
    UPDATE order_notifications
    SET status = 'failed', last_error = ${truncate(message, 1500)}, updated_at = NOW()
    WHERE id = ${id}
  `;
}

export async function queueAndSendApprovedOrderNotification(orderId: string) {
  const order = await getApprovedOrder(orderId);
  if (!order) return { queued: false, sent: false, reason: "order_not_approved" };

  const pending = await createPendingNotification(order);
  if (!pending) return { queued: false, sent: false, reason: "recipient_missing" };
  if (pending.status === "sent" || pending.status === "delivered" || pending.status === "read") {
    return { queued: true, sent: true, duplicate: true };
  }

  if (String(process.env.WHATSAPP_CLOUD_ENABLED || "").toLowerCase() !== "true") {
    return { queued: true, sent: false, reason: "disabled" };
  }

  const accessToken = String(process.env.WHATSAPP_CLOUD_ACCESS_TOKEN || "").trim();
  const phoneNumberId = String(process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID || "").trim();
  const templateName = String(process.env.WHATSAPP_SELLER_TEMPLATE_NAME || "").trim();
  const languageCode = String(process.env.WHATSAPP_SELLER_TEMPLATE_LANGUAGE || "pt_BR").trim() || "pt_BR";
  const apiVersion = String(process.env.WHATSAPP_CLOUD_API_VERSION || "v25.0").trim() || "v25.0";

  if (!accessToken || !phoneNumberId || !templateName) {
    return { queued: true, sent: false, reason: "configuration_missing" };
  }

  const db = getDatabase();
  const claimed = await db.sql`
    UPDATE order_notifications
    SET status = 'sending', attempts = attempts + 1, template_name = ${templateName},
        template_language = ${languageCode}, last_error = NULL, updated_at = NOW()
    WHERE id = ${pending.id}
      AND status IN ('pending', 'failed')
      AND attempts < 3
    RETURNING id, order_id, recipient, payload, attempts
  `;

  if (!claimed.length) return { queued: true, sent: false, reason: "already_processing_or_exhausted" };
  const notification = claimed[0] as any;
  const payload = notification.payload || {};

  const body = {
    messaging_product: "whatsapp",
    to: String(notification.recipient),
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: String(payload.orderNumber || "—") },
            { type: "text", text: String(payload.customerName || "—") },
            { type: "text", text: String(payload.customerPhone || "—") },
            { type: "text", text: String(payload.items || "—") },
            { type: "text", text: String(payload.total || "—") },
            { type: "text", text: String(payload.payment || "—") },
            { type: "text", text: String(payload.paymentId || "—") },
          ],
        },
      ],
    },
  };

  try {
    const response = await fetch(`https://graph.facebook.com/${encodeURIComponent(apiVersion)}/${encodeURIComponent(phoneNumberId)}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const result = await response.json().catch(() => ({})) as any;

    if (!response.ok) {
      const details = result?.error?.message || result?.error?.error_data?.details || `WhatsApp Cloud API HTTP ${response.status}`;
      await markFailed(String(notification.id), String(details));
      return { queued: true, sent: false, reason: "provider_error" };
    }

    const providerMessageId = String(result?.messages?.[0]?.id || "").trim() || null;
    await db.sql`
      UPDATE order_notifications
      SET status = 'sent', provider_message_id = ${providerMessageId}, sent_at = NOW(), updated_at = NOW()
      WHERE id = ${String(notification.id)}
    `;
    return { queued: true, sent: true, providerMessageId };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao enviar mensagem pelo WhatsApp Cloud API";
    await markFailed(String(notification.id), message);
    return { queued: true, sent: false, reason: "network_error" };
  }
}

export async function recordWhatsAppMessageStatus(providerMessageId: string, status: string, errorMessage?: string) {
  const id = String(providerMessageId || "").trim();
  if (!id) return;

  const normalized = String(status || "").trim().toLowerCase();
  const db = getDatabase();

  if (normalized === "sent") {
    await db.sql`UPDATE order_notifications SET status='sent', sent_at=COALESCE(sent_at,NOW()), updated_at=NOW() WHERE provider_message_id=${id}`;
  } else if (normalized === "delivered") {
    await db.sql`UPDATE order_notifications SET status='delivered', delivered_at=NOW(), updated_at=NOW() WHERE provider_message_id=${id}`;
  } else if (normalized === "read") {
    await db.sql`UPDATE order_notifications SET status='read', read_at=NOW(), delivered_at=COALESCE(delivered_at,NOW()), updated_at=NOW() WHERE provider_message_id=${id}`;
  } else if (normalized === "failed") {
    await db.sql`
      UPDATE order_notifications
      SET status='failed', last_error=${truncate(String(errorMessage || "Falha informada pelo WhatsApp"), 1500)}, updated_at=NOW()
      WHERE provider_message_id=${id}
    `;
  }
}
