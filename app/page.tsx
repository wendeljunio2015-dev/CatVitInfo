import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { products } from "@/data/products";

export default function Home() {
  const featured = products.filter((product) => product.featured);
  const promotions = products.filter((product) => product.badge === "Promoção");

  return (
    <main>
      <section className="relative overflow-hidden border-b border-zinc-800 bg-gradient-to-br from-zinc-950 via-zinc-900 to-blue-950">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="mb-5 inline-flex rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-blue-400">Catálogo online • Goiânia - GO</div>
          <h1 className="max-w-4xl text-4xl font-black leading-tight md:text-6xl">Tecnologia para seu PC com <span className="text-blue-500">atendimento direto</span> e orçamento rápido.</h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-300 md:text-lg">Encontre processadores, kits upgrade, placas-mãe, SSDs, memórias e outros componentes disponíveis na Vitória Informática.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/produtos" className="rounded-xl bg-blue-600 px-6 py-3 font-bold hover:bg-blue-500">Explorar catálogo</Link>
            <Link href="/promocoes" className="rounded-xl border border-red-500/30 bg-red-500/10 px-6 py-3 font-bold text-red-300 hover:bg-red-500/20">Promoções e destaques</Link>
            <a href="https://wa.me/5562994780830" target="_blank" rel="noopener noreferrer" className="rounded-xl border border-zinc-700 bg-zinc-950/40 px-6 py-3 font-bold hover:bg-zinc-800">Falar no WhatsApp</a>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-zinc-400">
            <span>✓ Atendimento em Goiânia</span><span>✓ Carrinho para orçamento</span><span>✓ Garantia informada por produto</span>
          </div>
        </div>
      </section>

      {promotions.length > 0 && (
        <section className="border-b border-zinc-800 bg-red-950/10">
          <div className="mx-auto max-w-7xl px-6 py-14">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div><p className="text-sm font-black uppercase tracking-widest text-red-400">Promoções ativas</p><h2 className="mt-2 text-3xl font-black">Ofertas do momento</h2></div>
              <Link href="/promocoes" className="font-bold text-red-400 hover:text-red-300">Ver todas →</Link>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{promotions.slice(0, 3).map((product) => <ProductCard key={product.id} product={product} />)}</div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-sm font-bold uppercase tracking-widest text-blue-400">Vitória Informática</p><h2 className="mt-2 text-3xl font-black">Produtos em destaque</h2><p className="mt-2 text-zinc-400">Confira alguns itens do catálogo e monte seu orçamento.</p></div>
          <Link href="/produtos" className="font-bold text-blue-400 hover:text-blue-300">Ver catálogo completo →</Link>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{featured.map((product) => <ProductCard key={product.id} product={product} />)}</div>
      </section>

      <section className="border-y border-zinc-800 bg-zinc-950">
        <div className="mx-auto grid max-w-7xl gap-5 px-6 py-14 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"><div className="text-2xl">📍</div><h3 className="mt-4 font-black">Atendimento em Goiânia</h3><p className="mt-2 text-sm leading-6 text-zinc-400">Consulte disponibilidade e opções de retirada ou entrega diretamente com a loja.</p></div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"><div className="text-2xl">💬</div><h3 className="mt-4 font-black">Orçamento pelo WhatsApp</h3><p className="mt-2 text-sm leading-6 text-zinc-400">Adicione vários produtos ao carrinho e envie o pedido completo em uma única mensagem.</p></div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"><div className="text-2xl">🛡️</div><h3 className="mt-4 font-black">Informações transparentes</h3><p className="mt-2 text-sm leading-6 text-zinc-400">Preço, disponibilidade e garantia são apresentados por produto e confirmados no atendimento.</p></div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="rounded-3xl border border-blue-500/20 bg-blue-600/10 p-8 md:flex md:items-center md:justify-between md:gap-8 md:p-10">
          <div><p className="text-sm font-black uppercase tracking-widest text-blue-400">Precisa de ajuda?</p><h2 className="mt-2 text-2xl font-black md:text-3xl">Fale diretamente com a Vitória Informática.</h2><p className="mt-3 text-zinc-400">Envie sua dúvida ou peça um orçamento pelo WhatsApp.</p></div>
          <a href="https://wa.me/5562994780830" target="_blank" rel="noopener noreferrer" className="mt-6 inline-block shrink-0 rounded-xl bg-green-600 px-6 py-3 font-black hover:bg-green-500 md:mt-0">Abrir WhatsApp</a>
        </div>
      </section>
    </main>
  );
}
