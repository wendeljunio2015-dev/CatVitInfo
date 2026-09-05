"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";

export default function Header() {
  const { itemCount } = useCart();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="min-w-0">
          <p className="truncate text-lg font-black text-blue-500 sm:text-xl">VITÓRIA INFORMÁTICA</p>
          <p className="text-xs text-zinc-400">Goiânia • Goiás</p>
        </Link>
        <nav className="hidden items-center gap-5 text-sm font-semibold text-zinc-300 md:flex">
          <Link href="/">Início</Link>
          <Link href="/produtos">Produtos</Link>
          <Link href="/carrinho">Carrinho</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/carrinho" className="rounded-xl border border-zinc-700 px-4 py-2 font-bold hover:bg-zinc-800">Carrinho ({itemCount})</Link>
          <a href="https://wa.me/5562994780830" target="_blank" rel="noopener noreferrer" className="hidden rounded-xl bg-green-600 px-4 py-2 font-bold hover:bg-green-500 sm:inline-block">WhatsApp</a>
        </div>
      </div>
    </header>
  );
}
