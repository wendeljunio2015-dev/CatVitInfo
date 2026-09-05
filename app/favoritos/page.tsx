"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { useFavorites } from "@/context/FavoritesContext";
import type { Product } from "@/types/product";

export default function FavoritesPage() {
  const { favoriteIds, clearFavorites } = useFavorites();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/catalog/products", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  const favorites = products.filter((product) => favoriteIds.includes(product.id));

  return (
    <main className="mx-auto max-w-7xl px-6 py-10 md:py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-widest text-blue-400">Minha seleção</p>
          <h1 className="mt-2 text-4xl font-black">Favoritos</h1>
          <p className="mt-3 max-w-2xl text-zinc-400">Salve os produtos que deseja comparar ou consultar depois. Eles ficam guardados neste navegador.</p>
        </div>
        {favorites.length > 0 && <button type="button" onClick={clearFavorites} className="rounded-xl border border-zinc-700 px-4 py-3 text-sm font-bold hover:bg-zinc-900">Limpar favoritos</button>}
      </div>

      {loading ? (
        <div className="mt-10 rounded-3xl border border-zinc-800 bg-zinc-900 p-10 text-center text-zinc-400">Carregando favoritos...</div>
      ) : favorites.length === 0 ? (
        <section className="mt-10 rounded-3xl border border-zinc-800 bg-zinc-900 p-10 text-center">
          <div className="text-5xl">♡</div>
          <h2 className="mt-4 text-2xl font-black">Nenhum produto favorito ainda</h2>
          <p className="mx-auto mt-3 max-w-xl text-zinc-400">Toque no coração de qualquer produto para salvá-lo aqui.</p>
          <Link href="/produtos" className="mt-6 inline-block rounded-xl bg-blue-600 px-6 py-3 font-bold hover:bg-blue-500">Ver produtos</Link>
        </section>
      ) : (
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{favorites.map((product) => <ProductCard key={product.id} product={product} />)}</div>
      )}
    </main>
  );
}
