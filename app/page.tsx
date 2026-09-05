import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { products } from "@/data/products";

export default function Home() {
  const featured = products.filter((product) => product.featured);

  return (
    <main>
      <section className="border-b border-zinc-800 bg-gradient-to-br from-zinc-950 via-zinc-900 to-blue-950">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
          <p className="mb-4 font-bold uppercase tracking-widest text-blue-400">Catálogo online</p>
          <h1 className="max-w-4xl text-4xl font-black leading-tight md:text-6xl">
            Tecnologia com qualidade, <span className="text-blue-500">garantia</span> e o melhor preço.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-zinc-300">Processadores, kits upgrade, placas-mãe, SSDs, memórias e componentes para seu computador.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/produtos" className="rounded-xl bg-blue-600 px-6 py-3 font-bold hover:bg-blue-500">Ver produtos</Link>
            <a href="https://wa.me/5562994780830" target="_blank" rel="noopener noreferrer" className="rounded-xl border border-zinc-700 px-6 py-3 font-bold hover:bg-zinc-800">Solicitar orçamento</a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-blue-400">Vitória Informática</p>
            <h2 className="mt-2 text-3xl font-black">Produtos em destaque</h2>
          </div>
          <Link href="/produtos" className="font-bold text-blue-400 hover:text-blue-300">Ver catálogo completo →</Link>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featured.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </section>

      <section className="border-y border-zinc-800 bg-zinc-950">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 py-12 md:grid-cols-3">
          <div className="rounded-2xl bg-zinc-900 p-6"><h3 className="font-black">Atendimento em Goiânia</h3><p className="mt-2 text-sm leading-6 text-zinc-400">Consulte retirada, entrega local e disponibilidade diretamente com a loja.</p></div>
          <div className="rounded-2xl bg-zinc-900 p-6"><h3 className="font-black">Orçamento pelo WhatsApp</h3><p className="mt-2 text-sm leading-6 text-zinc-400">Monte o carrinho com vários produtos e envie tudo em uma única mensagem.</p></div>
          <div className="rounded-2xl bg-zinc-900 p-6"><h3 className="font-black">Garantia por produto</h3><p className="mt-2 text-sm leading-6 text-zinc-400">A garantia é exibida quando confirmada. Nos demais itens, consulte antes da compra.</p></div>
        </div>
      </section>
    </main>
  );
}
