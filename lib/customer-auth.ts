import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const CUSTOMER_COOKIE = "vitoria-customer-session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

function getSecret() {
  const secret = process.env.CUSTOMER_SESSION_SECRET;
  if (!secret) throw new Error("CUSTOMER_SESSION_SECRET não configurado.");
  return secret;
}

function signCustomerId(customerId: string) {
  return createHmac("sha256", getSecret()).update(customerId).digest("hex");
}

export function createCustomerSessionToken(customerId: string) {
  return `${customerId}.${signCustomerId(customerId)}`;
}

export function getCustomerIdFromToken(token?: string) {
  if (!token) return null;
  const separator = token.lastIndexOf(".");
  if (separator <= 0) return null;
  const customerId = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  const expected = signCustomerId(customerId);
  const receivedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (receivedBuffer.length !== expectedBuffer.length || !timingSafeEqual(receivedBuffer, expectedBuffer)) return null;
  return customerId;
}

export async function getAuthenticatedCustomerId() {
  const cookieStore = await cookies();
  return getCustomerIdFromToken(cookieStore.get(CUSTOMER_COOKIE)?.value);
}

export async function requireCustomer() {
  const customerId = await getAuthenticatedCustomerId();
  if (!customerId) redirect("/cliente/login");
  return customerId;
}

export function customerCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash?: string | null) {
  if (!storedHash || !storedHash.includes(":")) return false;
  const [salt, expectedHex] = storedHash.split(":", 2);
  const calculated = scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHex, "hex");
  return calculated.length === expected.length && timingSafeEqual(calculated, expected);
}
