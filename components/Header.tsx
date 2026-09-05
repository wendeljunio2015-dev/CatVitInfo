"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import { useFavorites } from "@/context/FavoritesContext";

function CartIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 1.9-1.4L21 8H7" /><circle cx="10" cy="20" r="1" fill="currentColor" stroke="none" /><circle cx="18" cy="20" r="1" fill="currentColor" stroke="none" /></svg>;
}
function HeartIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" /></svg>; }
function WhatsAppIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M12 2a9.8 9.8 0 0 0-8.4 14.9L2 22l5.3-1.5A9.9 9.9 0 1 0 12 2Zm0 17.9c-1.5 0-3-.4-4.3-1.2l-.3-.2-3.1.9.9-3-.2-.3A7.9 7.9 0 1 1 12 19.9Zm4.3-5.9c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.6.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1-1.4-.7-2.4-1.3-3.3-2.9-.2-.3.2-.3.7-1.1.1-.2.1-.4 0-.6 0-.2-.6-1.5-.9-2-.2-.5-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.2-1.2 2.9s1.2 3.3 1.4 3.5c.2.2 2.4 3.7 5.9 5.2 2.2.9 3.1 1 4.2.8.7-.1 2.1-.9 2.4-1.7.3-.8.3-1.5.2-1.7-.1-.2-.3-.2-.6-.3Z" /></svg>; }

type CustomerSession = { authenticated: boolean; customer?: { id: string; name: string } };

export default function Header() {
  const { itemCount } = useCart();
  const { count: favoriteCount } = useFavorites();
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<CustomerSession | null>(null);
  const close = () => setOpen(false);

  useEffect(() => {
    let active = true;
    fetch("/api/customer/session", { cache: "no-store" }).then((response) => response.json()).then((data: CustomerSession) => { if (active) setSession(data); }).catch(() => { if (active) setSession({ authenticated: false }); });
    return () => { active = false; };
  }, []);

  const authenticated = session?.authenticated === true;
  const guest = session?.authenticated === false;

  return <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
    <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:gap-3 sm:px-5">
      <Link href="/" onClick={close} className="flex shrink-0 items-center gap-2.5"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-lg font-black text-white shadow-lg shadow-blue-950/40">V</span><span className="whitespace-nowrap"><span className="block text-sm font-black leading-tight text-white sm:text-lg">VITÓRIA <span className="text-blue-500">INFORMÁTICA</span></span><span className="block text-[10px] leading-tight text-zinc-400 sm:text-[11px]">Goiânia • Goiás</span></span></Link>
      <nav className="hidden items-center gap-3 text-xs font-semibold text-zinc-300 2xl:flex"><Link className="hover:text-white" href="/">Início</Link><Link className="hover:text-white" href="/produtos">Produtos</Link><Link className="font-bold text-red-400 hover:text-red-300" href="/promocoes">Promoções</Link><Link className="font-black text-blue-400 hover:text-blue-300" href="/monte-seu-pc">Monte seu PC</Link><Link className="flex items-center gap-1 hover:text-white" href="/favoritos"><HeartIcon />Favoritos ({favoriteCount})</Link></nav>
      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        {guest && <Link href="/cliente/login" className="hidden rounded-lg border border-zinc-700 px-2.5 py-1.5 text-xs font-bold hover:bg-zinc-800 lg:inline-block">Entrar</Link>}
        {guest && <Link href="/cliente/cadastro" className="hidden rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-bold hover:bg-blue-500 xl:inline-block">Cadastro</Link>}
        <Link href="/carrinho" aria-label={`Carrinho com ${itemCount} item(ns)`} className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-2.5 py-1.5 text-xs font-bold hover:bg-zinc-800"><CartIcon /><span className="hidden md:inline">Carrinho</span><span className="text-blue-400">({itemCount})</span></Link>
        <a href="/whatsapp" target="_blank" rel="noopener noreferrer" className="hidden items-center gap-1.5 rounded-lg bg-green-600 px-2.5 py-1.5 text-xs font-black text-white hover:bg-green-500 md:flex"><WhatsAppIcon />WhatsApp</a>
        {authenticated && <Link href="/cliente/minha-conta" className="hidden rounded-lg border border-zinc-700 px-2.5 py-1.5 text-xs font-bold hover:bg-zinc-800 lg:inline-block">Minha conta</Link>}
        {authenticated && <form action="/api/customer/logout" method="post" className="hidden lg:block"><button className="rounded-lg border border-red-500/30 px-2.5 py-1.5 text-xs font-bold text-red-300 hover:bg-red-500/10">Sair</button></form>}
        <button type="button" onClick={() => setOpen((value) => !value)} aria-label="Abrir menu" aria-expanded={open} className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-700 text-lg 2xl:hidden">{open ? "×" : "☰"}</button>
      </div>
    </div>
    {open && <nav className="border-t border-zinc-800 bg-zinc-950 px-4 py-4 2xl:hidden"><div className="mx-auto grid max-w-7xl gap-2 text-sm font-bold"><Link onClick={close} href="/" className="rounded-xl px-4 py-3 hover:bg-zinc-900">Início</Link><Link onClick={close} href="/produtos" className="rounded-xl px-4 py-3 hover:bg-zinc-900">Produtos</Link><Link onClick={close} href="/promocoes" className="rounded-xl bg-red-500/10 px-4 py-3 text-red-400 hover:bg-red-500/20">Promoções</Link><Link onClick={close} href="/monte-seu-pc" className="rounded-xl bg-blue-600/10 px-4 py-3 text-blue-400 hover:bg-blue-600/20">Monte seu PC</Link><Link onClick={close} href="/favoritos" className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 hover:bg-zinc-900"><HeartIcon />Favoritos ({favoriteCount})</Link>{guest && <Link onClick={close} href="/cliente/login" className="rounded-xl border border-zinc-700 px-4 py-3 text-center">Entrar</Link>}{guest && <Link onClick={close} href="/cliente/cadastro" className="rounded-xl bg-blue-600 px-4 py-3 text-center">Criar cadastro</Link>}<a onClick={close} href="/whatsapp" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-center hover:bg-green-500"><WhatsAppIcon />Falar no WhatsApp</a>{authenticated && <Link onClick={close} href="/cliente/minha-conta" className="rounded-xl bg-zinc-900 px-4 py-3 text-center">Minha conta</Link>}{authenticated && <form action="/api/customer/logout" method="post"><button className="w-full rounded-xl border border-red-500/30 px-4 py-3 text-red-300">Sair</button></form>}</div></nav>}
  </header>;
}
