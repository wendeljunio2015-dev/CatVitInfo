"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { useFavorites } from "@/context/FavoritesContext";

export default function Header() {
  const { itemCount } = useCart();
  const { count: favoriteCount } = useFavorites();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <Link href="/" onClick={close} className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-xl font-black text-white shadow-lg shadow-blue-950/40">V</span>
          <span className="min-w-0"><span className="block truncate text-base font-black text-white sm:text-xl">VITÓRIA <span className="text-blue-500">INFORMÁTICA</span></span><span className="block text-[11px] text-zinc-400 sm:text-xs">Goiânia • Goiás</span></span>
        </Link>

        <nav className="hidden items-center gap-4 text-sm font-semibold text-zinc-300 lg:flex">
          <Link className="hover:text-white" href="/">Início</Link>
          <Link className="hover:text-white" href="/produtos">Produtos</Link>
          <Link className="font-bold text-red-400 hover:text-red-300" href="/promocoes">Promoções</Link>
          <Link className="font-black text-blue-400 hover:text-blue-300" href="/monte-seu-pc">Monte seu PC</Link>
          <Link className="hover:text-white" href="/favoritos">Favoritos ({favoriteCount})</Link>
          <Link className="hover:text-white" href="/carrinho">Carrinho</Link>
          <Link className="hover:text-white" href="/cliente/minha-conta">Minha conta</Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/cliente/login" className="hidden rounded-xl border border-zinc-700 px-3 py-2 text-sm font-bold hover:bg-zinc-800 sm:inline-block">Entrar</Link>
          <Link href="/cliente/cadastro" className="hidden rounded-xl bg-blue-600 px-3 py-2 text-sm font-bold hover:bg-blue-500 md:inline-block">Cadastro</Link>
          <Link href="/carrinho" className="rounded-xl border border-zinc-700 px-3 py-2 text-sm font-bold hover:bg-zinc-800 sm:px-4">Carrinho <span className="text-blue-400">({itemCount})</span></Link>
          <button type="button" onClick={() => setOpen((value) => !value)} aria-label="Abrir menu" aria-expanded={open} className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-700 text-xl lg:hidden">{open ? "×" : "☰"}</button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-zinc-800 bg-zinc-950 px-4 py-4 lg:hidden">
          <div className="mx-auto grid max-w-7xl gap-2 text-sm font-bold">
            <Link onClick={close} href="/" className="rounded-xl px-4 py-3 hover:bg-zinc-900">Início</Link>
            <Link onClick={close} href="/produtos" className="rounded-xl px-4 py-3 hover:bg-zinc-900">Produtos</Link>
            <Link onClick={close} href="/promocoes" className="rounded-xl bg-red-500/10 px-4 py-3 text-red-400 hover:bg-red-500/20">Promoções</Link>
            <Link onClick={close} href="/monte-seu-pc" className="rounded-xl bg-blue-600/10 px-4 py-3 text-blue-400 hover:bg-blue-600/20">Monte seu PC</Link>
            <Link onClick={close} href="/favoritos" className="rounded-xl px-4 py-3 hover:bg-zinc-900">Favoritos ({favoriteCount})</Link>
            <Link onClick={close} href="/carrinho" className="rounded-xl px-4 py-3 hover:bg-zinc-900">Carrinho ({itemCount})</Link>
            <Link onClick={close} href="/cliente/login" className="rounded-xl border border-zinc-700 px-4 py-3 text-center">Entrar</Link>
            <Link onClick={close} href="/cliente/cadastro" className="rounded-xl bg-blue-600 px-4 py-3 text-center">Criar cadastro</Link>
            <Link onClick={close} href="/cliente/minha-conta" className="rounded-xl bg-zinc-900 px-4 py-3 text-center">Minha conta</Link>
            <a onClick={close} href="https://wa.me/5562994780830" target="_blank" rel="noopener noreferrer" className="rounded-xl bg-green-600 px-4 py-3 text-center hover:bg-green-500">Falar no WhatsApp</a>
          </div>
        </nav>
      )}
    </header>
  );
}
