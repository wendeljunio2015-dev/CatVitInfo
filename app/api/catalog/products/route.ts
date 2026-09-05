import { NextResponse } from "next/server";
import { getCatalogProducts } from "@/lib/catalog-db";

export const dynamic = "force-dynamic";

export async function GET() {
  const products = await getCatalogProducts();
  return NextResponse.json(products);
}
