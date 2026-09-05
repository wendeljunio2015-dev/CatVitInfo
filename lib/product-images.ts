import { getStore } from "@netlify/blobs";

const STORE_NAME = "product-images";
const MAX_IMAGE_SIZE = 8 * 1024 * 1024;

const allowedTypes: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function getProductImageStore() {
  return getStore(STORE_NAME, { consistency: "strong" });
}

export async function saveProductImage(file: File) {
  const extension = allowedTypes[file.type];
  if (!extension) {
    throw new Error("Formato de imagem inválido. Use JPG, PNG ou WebP.");
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error("A imagem deve ter no máximo 8 MB.");
  }

  const key = `${crypto.randomUUID()}.${extension}`;
  const store = getProductImageStore();
  await store.set(key, await file.arrayBuffer());

  return `/api/product-images/${key}`;
}

export function getImageContentType(key: string) {
  if (key.endsWith(".png")) return "image/png";
  if (key.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}
