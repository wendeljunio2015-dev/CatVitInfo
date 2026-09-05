import ProductsCatalog from "@/components/ProductsCatalog";
import { getCatalogProducts } from "@/lib/catalog-db";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  let products = [] as Awaited<ReturnType<typeof getCatalogProducts>>;

  try {
    products = await getCatalogProducts();
  } catch {
    products = [];
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-widest text-blue-400">Catálogo</p>
        <h1 className="mt-2 text-4xl font-black">Produtos</h1>
        <p className="mt-3 text-zinc-400">Pesquise e adicione os itens ao carrinho para montar seu orçamento.</p>
      </div>

      <ProductsCatalog products={products} />
    </main>
  );
}
