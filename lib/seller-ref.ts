import { cookies } from "next/headers";

export const SELLER_COOKIE = "vitoria-seller-ref";
export const SELLER_FALLBACK_COOKIE = "vitoria-seller-ref-fallback";
export const SELLER_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export async function getSellerRef() {
  const store = await cookies();
  return store.get(SELLER_COOKIE)?.value || store.get(SELLER_FALLBACK_COOKIE)?.value || null;
}
