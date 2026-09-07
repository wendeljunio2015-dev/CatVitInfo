import { createHmac, timingSafeEqual } from "crypto";

export const QUOTE_DRAFT_COOKIE = "vitoria-quote-draft";
export const QUOTE_DRAFT_MAX_AGE = 60 * 10;

export type QuoteDraft = {
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  customerId: string | null;
  sellerRef: string | null;
  items: Array<{ productId: string; quantity: number }>;
  expiresAt: number;
};

function secret() {
  const value = process.env.CUSTOMER_SESSION_SECRET;
  if (!value) throw new Error("CUSTOMER_SESSION_SECRET não configurado.");
  return value;
}

function encode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

export function signQuoteDraft(draft: QuoteDraft) {
  const payload = encode(JSON.stringify(draft));
  const signature = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyQuoteDraft(token?: string | null): QuoteDraft | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = createHmac("sha256", secret()).update(payload).digest("base64url");
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  try {
    const draft = JSON.parse(decode(payload)) as QuoteDraft;
    if (!draft.expiresAt || Date.now() > draft.expiresAt) return null;
    if (!Array.isArray(draft.items) || !draft.items.length) return null;
    return draft;
  } catch {
    return null;
  }
}
