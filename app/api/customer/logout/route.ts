import { NextResponse } from "next/server";
import { CUSTOMER_COOKIE, customerCookieOptions } from "@/lib/customer-auth";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/", request.url), 303);
  response.cookies.set(CUSTOMER_COOKIE, "", { ...customerCookieOptions(), maxAge: 0 });
  return response;
}
