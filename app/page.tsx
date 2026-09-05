const products = [
  { name: "Intel Core i5-10600K", price: 799, detail: "Garantia: 3 meses" },
  { name: "Kit Ryzen 5 5500 + B450 Husky NEXUS", price: 950, detail: "Consulte disponibilidade e garantia" },
  { name: "Kit B75 BlueCase + Intel Core i7-2700K", price: 370, detail: "Consulte disponibilidade e garantia" },
];

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default function Home() {
  return (
    <main>
      <header className="border-b border-zinc-800 bg-zinc-950">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-xl font-black text-blue-500">VITÓRIA INFORMÁTICA</p>
            <p className="text-xs text-zinc-400">Goiânia • Goiás</p>
          </div>
          <a className="rounded-xl bg-green-600 px-4 py-3 font-bold hover:bg-green-500" href="https://wa.me/5562994780830" target="_blank" rel="noreferrer">WhatsApp</a>
        </div>
      </header>

      <section className="border-b border-zinc-800 bg-gradient-to-br from-zinc-950 via-zinc-900 to-blue-950">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
          <p className="mb-4 font-bold uppercase tracking-widest text-blue-400">Catálogo online</p>
          <h1 className="max-w-4xl text-4xl font-black leading-tight md:text-6xl">Tecnologia com qualidade, <span className="text-blue-500">garantia</span> e o melhor preço.</h1>
          <p className="mt-6 max-w-2xl text-lg text-zinc-300">Processadores, kits upgrade, placas-mãe, SSDs, memórias e componentes para seu computador.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#produtos" className="rounded-xl bg-blue-600 px-6 py-3 font-bold hover:bg-blue-500">Ver produtos</a>
            <a href="https://wa.me/5562994780830" target="_blank" rel="noreferrer" className="rounded-xl border border-zinc-700 px-6 py-3 font-bold hover:bg-zinc-800">Solicitar orçamento</a>
          </div>
        </div>
      </section>

      <section id="produtos" className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-widest text-blue-400">Vitória Informática</p>
          <h2 className="mt-2 text-3xl font-black">Produtos em destaque</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {products.map((product) => (
            <article key={product.name} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              <div className="mb-6 flex aspect-video items-center justify-center rounded-xl bg-zinc-950 text-5xl">🖥️</div>
              <h3 className="min-h-14 text-xl font-bold">{product.name}</h3>
              <p className="mt-4 text-3xl font-black text-blue-500">{money.format(product.price)}</p>
              <p className="mt-2 text-sm text-zinc-400">{product.detail}</p>
              <a href={`https://wa.me/5562994780830?text=${encodeURIComponent(`Olá! Tenho interesse em: ${product.name}`)}`} target="_blank" rel="noreferrer" className="mt-6 block rounded-xl bg-blue-600 px-4 py-3 text-center font-bold hover:bg-blue-500">Tenho interesse</a>
            </article>
          ))}
        </div>
      </section>

      <footer className="border-t border-zinc-800 bg-zinc-950">
        <div className="mx-auto max-w-7xl px-6 py-10 text-sm text-zinc-400">
          <p className="font-bold text-white">Vitória Informática • Goiânia - GO</p>
          <p className="mt-2">Atendimento e orçamento pelo WhatsApp. Consulte disponibilidade e garantia de cada produto.</p>
        </div>
      </footer>
    </main>
  );
}
