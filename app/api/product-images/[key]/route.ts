import { getImageContentType, getProductImageStore } from "@/lib/product-images";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const safeKey = key.replace(/[^a-zA-Z0-9._-]/g, "");
  if (!safeKey) return new Response("Imagem inválida", { status: 400 });

  const store = getProductImageStore();
  const image = await store.get(safeKey, { type: "arrayBuffer" });

  if (!image) return new Response("Imagem não encontrada", { status: 404 });

  return new Response(image, {
    headers: {
      "Content-Type": getImageContentType(safeKey),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
