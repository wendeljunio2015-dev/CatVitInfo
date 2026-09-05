"use client";

import { useMemo, useState } from "react";
import ProductCard from "@/components/ProductCard";
import { categories, products } from "@/data/products";

export default function ProductsPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todos");

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory = category === "Todos" || product.category === category;
      const matchesQuery = !text || `${product.name} ${product.description} ${product.category}`.toLowerCase().includes(text);
      return matchesCategory && matchesQuery;
    });
  }, [query, category]);

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-widest text-blue-400">Catálogo</p>
        <h1 className="mt-2 text-4xl font-black">Produtos</h1>
        <p className="mt-3 text-zinc-400">Pesquise e adicione os itens ao carrinho para montar seu orçamento.</p>
      </div>

      <div className="mb-8 grid gap-4 lg:grid-cols-[1fr_auto]">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pesquisar produto..." className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 outline-none focus:border-blue-500" />
        <div className="flex flex-wrap gap-2">
          {categories.map((item) => (
            <button key={item} onClick={() => setCategory(item)} className={`rounded-xl px-4 py-3 text-sm font-bold ${category === item ? "bg-blue-600" : "border border-zinc-700 bg-zinc-900 hover:bg-zinc-800"}`}>{item}</button>
          ))}
        </div>
      </div>

      {filtered.length ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-10 text-center text-zinc-400">Nenhum produto encontrado.</div>
      )}
    </main>
  );
}
