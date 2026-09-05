"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Product } from "@/types/product";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const componentGroups = [
  { key: "cpu", label: "Processador", categories: ["Processadores"] },
  { key: "motherboard", label: "Placa-mãe", categories: ["Placas-mãe"] },
  { key: "memory", label: "Memória RAM", categories: ["Memórias RAM"] },
  { key: "storage", label: "SSD / Armazenamento", categories: ["SSDs"] },
  { key: "gpu", label: "Placa de Vídeo", categories: ["Placas de Vídeo"] },
  { key: "psu", label: "Fonte", categories: ["Fontes"] },
] as const;

type GroupKey = (typeof componentGroups)[number]["key"];
type Selection = Partial<Record<GroupKey, Product>>;

function extractSocket(product?: Product) {
  if (!product) return null;
  const text = [product.name, product.description, ...(product.specs ?? [])].join(" ").toUpperCase();
  const sockets = ["AM4", "AM5", "LGA1200", "LGA1700", "LGA1155"];
  return sockets.find((socket) => text.includes(socket)) ?? null;
}

export default function MonteSeuPcPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selection, setSelection] = useState<Selection>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/catalog/products", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  const total = useMemo(() => Object.values(selection).reduce((sum, product) => sum + (product?.price ?? 0), 0), [selection]);
  const cpuSocket = extractSocket(selection.cpu);
  const motherboardSocket = extractSocket(selection.motherboard);
  const incompatible = Boolean(cpuSocket && motherboardSocket && cpuSocket !== motherboardSocket);
  const selectedItems = Object.values(selection).filter(Boolean) as Product[];

  const whatsappHref = useMemo(() => {
    const lines = selectedItems.length ? selectedItems.map((product) => `• ${product.name} - ${money.format(product.price)}`).join("\n") : "Ainda não selecionei os componentes.";
    const message = `Olá! Montei uma configuração no catálogo da Vitória Informática:\n\n${lines}\n\nTotal estimado: ${money.format(total)}\n\nGostaria de confirmar disponibilidade, compatibilidade, garantia e orçamento final.`;
    return `/whatsapp?text=${encodeURIComponent(message)}`;
  }, [selectedItems, total]);

  return (
    <main className="mx-auto max-w-7xl px-6 py-10 md:py-16">
      <div className="max-w-3xl">
        <p className="text-sm font-black uppercase tracking-widest text-blue-400">Monte seu PC</p>
        <h1 className="mt-3 text-4xl font-black md:text-5xl">Escolha os componentes do seu computador.</h1>
        <p className="mt-5 text-lg leading-8 text-zinc-400">Selecione as peças disponíveis no catálogo. O valor é calculado automaticamente e você pode enviar a configuração completa para a Vitória Informática pelo WhatsApp.</p>
      </div>

      {loading ? <div className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center text-zinc-400">Carregando produtos...</div> : (
      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
        <section className="space-y-5">
          {componentGroups.map((group) => {
            const options = products.filter((product) => group.categories.includes(product.category as never) && product.stockStatus !== "indisponivel");
            const chosen = selection[group.key];
            return (
              <div key={group.key} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div><h2 className="text-lg font-black">{group.label}</h2><p className="mt-1 text-sm text-zinc-500">{chosen ? chosen.name : "Nenhum item selecionado"}</p></div>
                  {chosen && <button onClick={() => setSelection((current) => ({ ...current, [group.key]: undefined }))} className="text-sm font-bold text-zinc-400 hover:text-white">Remover</button>}
                </div>
                {options.length ? <div className="mt-4 grid gap-3">{options.map((product) => {
                  const active = chosen?.id === product.id;
                  return <button key={product.id} onClick={() => setSelection((current) => ({ ...current, [group.key]: product }))} className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-4 text-left ${active ? "border-blue-500 bg-blue-500/10" : "border-zinc-800 bg-zinc-950 hover:border-zinc-700"}`}><span><span className="block font-bold">{product.name}</span><span className="mt-1 block text-xs text-zinc-500">{product.warranty ? `Garantia: ${product.warranty}` : "Consulte a garantia"}</span></span><span className="shrink-0 font-black text-blue-400">{money.format(product.price)}</span></button>;
                })}</div> : <div className="mt-4 rounded-xl border border-dashed border-zinc-700 bg-zinc-950/60 px-4 py-5 text-sm text-zinc-500">Ainda não há produtos desta categoria cadastrados no catálogo.</div>}
              </div>
            );
          })}

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <h2 className="text-lg font-black">Kits Upgrade disponíveis</h2>
            <p className="mt-1 text-sm text-zinc-500">Uma alternativa prática quando processador e placa-mãe já são vendidos em conjunto.</p>
            <div className="mt-4 grid gap-3">{products.filter((product) => product.category === "Kits Upgrade" && product.stockStatus !== "indisponivel").map((product) => <Link key={product.id} href={`/produto/${product.slug}`} className="flex items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-4 hover:border-blue-500/60"><span className="font-bold">{product.name}</span><span className="shrink-0 font-black text-blue-400">{money.format(product.price)}</span></Link>)}</div>
          </div>
        </section>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-sm font-black uppercase tracking-widest text-blue-400">Sua configuração</p>
            <div className="mt-5 space-y-3">{selectedItems.length ? selectedItems.map((product) => <div key={product.id} className="flex justify-between gap-4 text-sm"><span className="text-zinc-300">{product.name}</span><span className="shrink-0 font-bold">{money.format(product.price)}</span></div>) : <p className="text-sm leading-6 text-zinc-500">Escolha os componentes para começar seu orçamento.</p>}</div>
            <div className="my-5 border-t border-zinc-800" />
            <div className="flex items-end justify-between gap-4"><span className="text-sm text-zinc-400">Total estimado</span><span className="text-2xl font-black text-blue-500">{money.format(total)}</span></div>
            {incompatible ? <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm leading-6 text-red-300">Atenção: o processador selecionado usa {cpuSocket} e a placa-mãe usa {motherboardSocket}. Essa combinação parece incompatível.</div> : cpuSocket && motherboardSocket ? <div className="mt-5 rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-300">Socket compatível identificado: {cpuSocket}.</div> : <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-xs leading-5 text-zinc-500">A compatibilidade automática é uma ajuda inicial. A Vitória Informática confirma a configuração antes da venda.</div>}
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="mt-5 block rounded-xl bg-green-600 px-5 py-3 text-center font-black hover:bg-green-500">Enviar configuração no WhatsApp</a>
            <button onClick={() => setSelection({})} disabled={!selectedItems.length} className="mt-3 w-full rounded-xl border border-zinc-700 px-5 py-3 font-bold disabled:cursor-not-allowed disabled:opacity-40 hover:bg-zinc-800">Limpar configuração</button>
          </div>
        </aside>
      </div>)}
    </main>
  );
}
