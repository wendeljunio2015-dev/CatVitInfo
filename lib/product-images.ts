import { getDeployStore, getStore } from "@netlify/blobs";

const STORE_NAME = "product-images";
const MAX_IMAGE_SIZE = 8 * 1024 * 1024;

const allowedTypes: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function isProductionRuntime() {
  const context = process.env.CONTEXT || process.env.NETLIFY_CONTEXT || "";
  if (context === "production") return true;

  const siteUrl = process.env.URL;
  const deployUrl = process.env.DEPLOY_PRIME_URL;
  return Boolean(siteUrl && deployUrl && siteUrl === deployUrl);
}

export function getProductImageStore() {
  return isProductionRuntime()
    ? getStore(STORE_NAME, { consistency: "strong" })
    : getDeployStore(STORE_NAME);
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
