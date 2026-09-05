import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { products } from "@/data/products";

export default function PromotionsPage() {
  const promotions = products.filter((product) => product.badge === "Promoção");
  const highlights = products.filter((product) => product.featured || product.badge === "Destaque");

  return (
    <main className="mx-auto max-w-7xl px-6 py-12 md:py-16">
      <section className="rounded-3xl border border-red-500/20 bg-gradient-to-br from-red-950/30 via-zinc-950 to-zinc-900 p-8 md:p-12">
        <p className="text-sm font-black uppercase tracking-widest text-red-400">Ofertas e destaques</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-black md:text-5xl">Produtos selecionados da Vitória Informática.</h1>
        <p className="mt-5 max-w-2xl leading-7 text-zinc-300">Quando um produto estiver realmente em promoção, ele aparecerá aqui com o selo correspondente. Itens em destaque também ficam reunidos nesta página.</p>
      </section>

      <section className="py-14">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-widest text-red-400">Promoções</p>
            <h2 className="mt-2 text-3xl font-black">Ofertas ativas</h2>
          </div>
          <Link href="/produtos" className="font-bold text-blue-400 hover:text-blue-300">Ver catálogo completo →</Link>
        </div>

        {promotions.length ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {promotions.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center">
            <p className="text-lg font-bold">Nenhuma promoção ativa no momento.</p>
            <p className="mt-2 text-sm text-zinc-400">Assim que um produto for marcado como promoção, ele aparecerá automaticamente aqui.</p>
          </div>
        )}
      </section>

      <section className="border-t border-zinc-800 py-14">
        <div className="mb-8">
          <p className="text-sm font-black uppercase tracking-widest text-blue-400">Destaques</p>
          <h2 className="mt-2 text-3xl font-black">Produtos recomendados</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {highlights.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </section>
    </main>
  );
}
