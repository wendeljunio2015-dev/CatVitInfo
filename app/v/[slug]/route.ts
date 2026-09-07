import { getDatabase } from "@netlify/database";
import { NextResponse } from "next/server";
import { SELLER_COOKIE, SELLER_COOKIE_MAX_AGE, SELLER_FALLBACK_COOKIE } from "@/lib/seller-ref";

export const dynamic = "force-dynamic";

const PRODUCTION_ORIGIN = "https://catvitinfo.netlify.app";
const PRODUCTION_HOST = "catvitinfo.netlify.app";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char] || char));
}

function getExternalHostname(request: Request) {
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || request.headers.get("host") || "";
  return host.split(":")[0].toLowerCase();
}

function isNetlifyDeployHost(hostname: string) {
  return hostname.endsWith("--catvitinfo.netlify.app");
}

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const externalHostname = getExternalHostname(request);

  if (externalHostname && externalHostname !== PRODUCTION_HOST && isNetlifyDeployHost(externalHostname)) {
    return NextResponse.redirect(new URL(`/v/${encodeURIComponent(slug)}`, PRODUCTION_ORIGIN), 302);
  }

  const db = getDatabase();
  const rows = await db.sql`SELECT id,name FROM sellers WHERE slug=${slug} AND active=TRUE LIMIT 1`;

  if (!rows.length) {
    const response = NextResponse.redirect(new URL("/", PRODUCTION_ORIGIN), 302);
    response.cookies.set(SELLER_COOKIE, "", { path: "/", maxAge: 0 });
    response.cookies.set(SELLER_FALLBACK_COOKIE, "", { path: "/", maxAge: 0 });
    response.headers.set("Cache-Control", "no-store, max-age=0");
    return response;
  }

  const sellerId = String(rows[0].id);
  const sellerName = String(rows[0].name);
  const destination = `${PRODUCTION_ORIGIN}/`;
  const secure = process.env.NODE_ENV === "production";

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta http-equiv="refresh" content="0;url=${escapeHtml(destination)}" />
<title>Vitória Informática</title>
</head>
<body style="margin:0;background:#09090b;color:#fff;font-family:system-ui,sans-serif;display:grid;min-height:100vh;place-items:center">
<p>Direcionando para o atendimento com ${escapeHtml(sellerName)}...</p>
<script>
  document.cookie = ${JSON.stringify(`${SELLER_FALLBACK_COOKIE}=${encodeURIComponent(sellerId)}; Path=/; Max-Age=${SELLER_COOKIE_MAX_AGE}; SameSite=Lax${secure ? "; Secure" : ""}`)};
  window.location.replace(${JSON.stringify(destination)});
</script>
</body>
</html>`;

  const response = new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
    },
  });

  response.cookies.set(SELLER_COOKIE, sellerId, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: SELLER_COOKIE_MAX_AGE,
  });
  response.cookies.set(SELLER_FALLBACK_COOKIE, sellerId, {
    httpOnly: false,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: SELLER_COOKIE_MAX_AGE,
  });

  return response;
}
