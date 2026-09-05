"use client";

import { useMemo, useState } from "react";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/types/product";

export default function ProductsCatalog({ products }: { products: Product[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todos");

  const categories = useMemo(
    () => ["Todos", ...Array.from(new Set(products.map((product) => product.category))).sort()],
    [products],
  );

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory = category === "Todos" || product.category === category;
      const matchesQuery = !text || `${product.name} ${product.description} ${product.category}`.toLowerCase().includes(text);
      return matchesCategory && matchesQuery;
    });
  }, [products, query, category]);

  return (
    <>
      <div className="mb-8 grid gap-4 lg:grid-cols-[1fr_auto]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Pesquisar produto..."
          className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 outline-none focus:border-blue-500"
        />
        <div className="flex flex-wrap gap-2">
          {categories.map((item) => (
            <button
              key={item}
              onClick={() => setCategory(item)}
              className={`rounded-xl px-4 py-3 text-sm font-bold ${category === item ? "bg-blue-600" : "border border-zinc-700 bg-zinc-900 hover:bg-zinc-800"}`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {filtered.length ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-10 text-center text-zinc-400">Nenhum produto cadastrado no momento.</div>
      )}
    </>
  );
}
