import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const ADMIN_COOKIE = "vitoria-admin-session";

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("ADMIN_SESSION_SECRET não configurado.");
  return secret;
}

export function createAdminSessionToken() {
  return createHmac("sha256", getSecret()).update("vitoria-informatica-admin").digest("hex");
}

export function isValidAdminSessionToken(token?: string) {
  if (!token) return false;
  const expected = createAdminSessionToken();
  const receivedBuffer = Buffer.from(token);
  const expectedBuffer = Buffer.from(expected);
  return receivedBuffer.length === expectedBuffer.length && timingSafeEqual(receivedBuffer, expectedBuffer);
}

export function isValidAdminPassword(password: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const receivedBuffer = Buffer.from(password);
  const expectedBuffer = Buffer.from(expected);
  return receivedBuffer.length === expectedBuffer.length && timingSafeEqual(receivedBuffer, expectedBuffer);
}

export async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!isValidAdminSessionToken(token)) redirect("/admin/login");
}
