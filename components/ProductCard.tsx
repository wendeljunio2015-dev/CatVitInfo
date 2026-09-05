"use client";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useFavorites } from "@/context/FavoritesContext";
import type { Product } from "@/types/product";
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const stockLabel = { em_estoque: "Em estoque", ultimas_unidades: "Últimas unidades", indisponivel: "Indisponível" };
const badgeStyle = { Novo: "bg-emerald-500/15 text-emerald-400", Promoção: "bg-red-500/15 text-red-400", Destaque: "bg-blue-600/20 text-blue-400" };
export default function ProductCard({ product }: { product: Product }) {
 const { addItem }=useCart(); const {isFavorite,toggleFavorite}=useFavorites(); const unavailable=product.stockStatus==="indisponivel"; const favorite=isFavorite(product.id);
 return <article className="relative flex h-full flex-col rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
  <button type="button" onClick={()=>toggleFavorite(product.id)} aria-label={favorite?"Remover dos favoritos":"Adicionar aos favoritos"} className="absolute right-7 top-7 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700 bg-zinc-950/90 text-lg">{favorite?"♥":"♡"}</button>
  <Link href={`/produto/${product.slug}`} className="mb-5 flex aspect-video items-center justify-center overflow-hidden rounded-xl bg-zinc-950">{product.image?<img src={product.image} alt={product.name} className="h-full w-full object-contain p-4"/>:<span className="text-5xl">🖥️</span>}</Link>
  <div className="flex flex-1 flex-col"><div className="flex flex-wrap gap-2"><span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300">{product.category}</span>{product.badge&&<span className={`rounded-full px-3 py-1 text-xs font-bold ${badgeStyle[product.badge]}`}>{product.badge}</span>}</div>
   <Link href={`/produto/${product.slug}`} className="mt-4 text-xl font-bold hover:text-blue-400">{product.name}</Link><p className="mt-2 text-sm leading-6 text-zinc-400">{product.description}</p>
   <div className="mt-auto pt-5"><p className="text-3xl font-black text-blue-500">{money.format(product.price)}</p><p className="mt-2 text-sm text-zinc-400">{product.warranty?`Garantia: ${product.warranty}`:"Consulte a garantia"}</p><p className={`mt-1 text-sm font-semibold ${product.stockStatus==="ultimas_unidades"?"text-amber-400":product.stockStatus==="indisponivel"?"text-red-400":"text-zinc-300"}`}>{stockLabel[product.stockStatus]}{product.stockQuantity!=null&&product.stockQuantity>0?` • ${product.stockQuantity} un.`:""}</p>
    <div className="mt-5 grid gap-2"><Link href={`/produto/${product.slug}`} className="rounded-xl border border-zinc-700 px-4 py-3 text-center font-bold hover:bg-zinc-800">Ver detalhes</Link><button disabled={unavailable} onClick={()=>addItem(product)} className="w-full rounded-xl bg-blue-600 px-4 py-3 font-bold disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400 hover:bg-blue-500">{unavailable?"Indisponível":"Adicionar ao carrinho"}</button></div>
   </div></div>
 </article>;
}
