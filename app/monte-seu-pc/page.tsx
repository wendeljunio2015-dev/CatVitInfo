"use client";

import { useEffect, useMemo, useState } from "react";
import type { Product } from "@/types/product";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const componentGroups = [
  { key: "cpu", label: "Processador", categories: ["Processadores"] },
  { key: "motherboard", label: "Placa-mãe", categories: ["Placas-mãe"] },
  { key: "memory", label: "Memória RAM", categories: ["Memórias RAM"] },
  { key: "storage", label: "SSD / Armazenamento", categories: ["SSDs"] },
  { key: "gpu", label: "Placa de Vídeo", categories: ["Placas de Vídeo"] },
  { key: "psu", label: "Fonte", categories: ["Fontes"] },
  { key: "cooler", label: "Cooler", categories: ["Coolers"] },
  { key: "case", label: "Gabinete", categories: ["Gabinetes"] },
] as const;

type GroupKey = (typeof componentGroups)[number]["key"];
type SelectionKey = GroupKey | "kit";
type Selection = Partial<Record<SelectionKey, Product>>;

function extractSocket(product?: Product) {
  if (!product) return null;
  const text = [product.name, product.description, ...(product.specs ?? [])].join(" ").toUpperCase();
  const sockets = ["AM4", "AM5", "LGA1200", "LGA1700", "LGA1155"];
  return sockets.find((socket) => text.includes(socket)) ?? null;
}

function ProductThumb({ product }: { product: Product }) {
  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
      {product.image ? <img src={product.image} alt={product.name} className="h-full w-full object-contain p-2" loading="lazy" /> : <span className="text-2xl" aria-hidden="true">🖥️</span>}
    </div>
  );
}

export default function MonteSeuPcPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selection, setSelection] = useState<Selection>({});
  const [loading, setLoading] = useState(true);
  const [openGroup, setOpenGroup] = useState<GroupKey | "kits" | null>(null);

  useEffect(() => {
    fetch("/api/catalog/products", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  const total = useMemo(() => Object.values(selection).reduce((sum, product) => sum + (product?.price ?? 0), 0), [selection]);
  const cpuSocket = extractSocket(selection.cpu);
  const motherboardSocket = extractSocket(selection.motherboard);
  const incompatible = !selection.kit && Boolean(cpuSocket && motherboardSocket && cpuSocket !== motherboardSocket);
  const selectedItems = Object.values(selection).filter(Boolean) as Product[];
  const upgradeKits = products.filter((product) => product.category === "Kits Upgrade" && product.stockStatus !== "indisponivel");
  const selectedKit = selection.kit;

  const whatsappHref = useMemo(() => {
    const lines = selectedItems.length ? selectedItems.map((product) => `• ${product.name} - ${money.format(product.price)}`).join("\n") : "Ainda não selecionei os componentes.";
    const message = `Olá! Montei uma configuração no catálogo da Vitória Informática:\n\n${lines}\n\nTotal estimado: ${money.format(total)}\n\nGostaria de confirmar disponibilidade, compatibilidade, garantia e orçamento final.`;
    return `/whatsapp?text=${encodeURIComponent(message)}`;
  }, [selectedItems, total]);

  const chooseComponent = (key: GroupKey, product: Product) => {
    setSelection((current) => ({
      ...current,
      ...(key === "cpu" || key === "motherboard" ? { kit: undefined } : {}),
      [key]: product,
    }));
    setOpenGroup(null);
  };

  const chooseKit = (product: Product) => {
    setSelection((current) => ({ ...current, kit: product, cpu: undefined, motherboard: undefined }));
    setOpenGroup(null);
  };

  return (
    <main className="mx-auto max-w-7xl px-6 py-10 md:py-16">
      <div className="max-w-3xl">
        <p className="text-sm font-black uppercase tracking-widest text-blue-400">Monte seu PC</p>
        <h1 className="mt-3 text-4xl font-black md:text-5xl">Escolha os componentes do seu computador.</h1>
        <p className="mt-5 text-lg leading-8 text-zinc-400">Abra cada categoria para ver somente as opções daquele componente. Escolha as peças disponíveis, acompanhe o total e envie a configuração completa para a Vitória Informática pelo WhatsApp.</p>
      </div>

      {loading ? <div className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center text-zinc-400">Carregando produtos...</div> : (
      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
        <section className="space-y-4">
          {componentGroups.map((group) => {
            const options = products.filter((product) => group.categories.includes(product.category as never) && product.stockStatus !== "indisponivel");
            const chosen = selection[group.key];
            const isOpen = openGroup === group.key;

            return (
              <div key={group.key} className={`overflow-hidden rounded-2xl border bg-zinc-900 transition-colors ${isOpen ? "border-blue-500/60" : "border-zinc-800"}`}>
                <div className="flex items-center gap-3 p-4 sm:p-5">
                  <button type="button" onClick={() => setOpenGroup((current) => current === group.key ? null : group.key)} aria-expanded={isOpen} className="flex min-w-0 flex-1 items-center gap-4 text-left">
                    {chosen && <ProductThumb product={chosen} />}
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2"><span className="text-lg font-black text-white">{group.label}</span>{chosen && <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[11px] font-black uppercase tracking-wide text-green-400">Selecionado</span>}</span>
                      <span className="mt-1 block truncate text-sm text-zinc-500">{chosen ? chosen.name : options.length ? `${options.length} ${options.length === 1 ? "opção disponível" : "opções disponíveis"}` : "Nenhuma opção disponível"}</span>
                    </span>
                    <span className={`shrink-0 text-xl text-zinc-400 transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden="true">⌄</span>
                  </button>
                  {chosen && <button type="button" onClick={() => setSelection((current) => ({ ...current, [group.key]: undefined }))} className="shrink-0 rounded-lg border border-zinc-700 px-3 py-2 text-xs font-bold text-zinc-400 hover:bg-zinc-800 hover:text-white">Remover</button>}
                </div>

                {isOpen && <div className="border-t border-zinc-800 bg-zinc-950/50 p-4 sm:p-5">
                  {options.length ? <div className="grid gap-3 sm:grid-cols-2">{options.map((product) => {
                    const active = chosen?.id === product.id;
                    return <button key={product.id} type="button" onClick={() => chooseComponent(group.key, product)} className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${active ? "border-blue-500 bg-blue-500/10" : "border-zinc-800 bg-zinc-950 hover:border-zinc-600 hover:bg-zinc-900"}`}>
                      <ProductThumb product={product} />
                      <span className="min-w-0 flex-1"><span className="block text-sm font-bold leading-5 text-white">{product.name}</span><span className="mt-1 block text-xs text-zinc-500">{product.warranty ? `Garantia: ${product.warranty}` : "Consulte a garantia"}</span><span className="mt-2 block font-black text-blue-400">{money.format(product.price)}</span></span>
                      {active && <span className="shrink-0 text-lg text-green-400" aria-label="Selecionado">✓</span>}
                    </button>;
                  })}</div> : <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-950/60 px-4 py-5 text-sm text-zinc-500">Ainda não há produtos desta categoria cadastrados no catálogo.</div>}
                </div>}
              </div>
            );
          })}

          <div className={`overflow-hidden rounded-2xl border bg-zinc-900 transition-colors ${openGroup === "kits" ? "border-blue-500/60" : "border-zinc-800"}`}>
            <div className="flex items-center gap-3 p-4 sm:p-5">
              <button type="button" onClick={() => setOpenGroup((current) => current === "kits" ? null : "kits")} aria-expanded={openGroup === "kits"} className="flex min-w-0 flex-1 items-center gap-4 text-left">
                {selectedKit && <ProductThumb product={selectedKit} />}
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2"><span className="text-lg font-black text-white">Kits Upgrade</span>{selectedKit && <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[11px] font-black uppercase tracking-wide text-green-400">Selecionado</span>}</span>
                  <span className="mt-1 block truncate text-sm text-zinc-500">{selectedKit ? selectedKit.name : upgradeKits.length ? `${upgradeKits.length} ${upgradeKits.length === 1 ? "opção disponível" : "opções disponíveis"}` : "Nenhuma opção disponível"}</span>
                </span>
                <span className={`shrink-0 text-xl text-zinc-400 transition-transform ${openGroup === "kits" ? "rotate-180" : ""}`} aria-hidden="true">⌄</span>
              </button>
              {selectedKit && <button type="button" onClick={() => setSelection((current) => ({ ...current, kit: undefined }))} className="shrink-0 rounded-lg border border-zinc-700 px-3 py-2 text-xs font-bold text-zinc-400 hover:bg-zinc-800 hover:text-white">Remover</button>}
            </div>

            {openGroup === "kits" && <div className="border-t border-zinc-800 bg-zinc-950/50 p-4 sm:p-5">
              <p className="mb-4 text-sm text-zinc-500">O kit substitui a escolha separada de processador e placa-mãe. Ao selecionar um kit, essas duas seleções são removidas automaticamente.</p>
              {upgradeKits.length ? <div className="grid gap-3 sm:grid-cols-2">{upgradeKits.map((product) => {
                const active = selectedKit?.id === product.id;
                return <button key={product.id} type="button" onClick={() => chooseKit(product)} className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${active ? "border-blue-500 bg-blue-500/10" : "border-zinc-800 bg-zinc-950 hover:border-zinc-600 hover:bg-zinc-900"}`}>
                  <ProductThumb product={product} />
                  <span className="min-w-0 flex-1"><span className="block text-sm font-bold leading-5 text-white">{product.name}</span><span className="mt-1 block text-xs text-zinc-500">{product.warranty ? `Garantia: ${product.warranty}` : "Consulte a garantia"}</span><span className="mt-2 block font-black text-blue-400">{money.format(product.price)}</span></span>
                  {active && <span className="shrink-0 text-lg text-green-400" aria-label="Selecionado">✓</span>}
                </button>;
              })}</div> : <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-950/60 px-4 py-5 text-sm text-zinc-500">Ainda não há kits upgrade disponíveis no catálogo.</div>}
            </div>}
          </div>
        </section>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-sm font-black uppercase tracking-widest text-blue-400">Sua configuração</p>
            <div className="mt-5 space-y-3">{selectedItems.length ? selectedItems.map((product) => <div key={product.id} className="flex justify-between gap-4 text-sm"><span className="text-zinc-300">{product.name}</span><span className="shrink-0 font-bold">{money.format(product.price)}</span></div>) : <p className="text-sm leading-6 text-zinc-500">Escolha os componentes para começar seu orçamento.</p>}</div>
            <div className="my-5 border-t border-zinc-800" />
            <div className="flex items-end justify-between gap-4"><span className="text-sm text-zinc-400">Total estimado</span><span className="text-2xl font-black text-blue-500">{money.format(total)}</span></div>
            {selectedKit ? <div className="mt-5 rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-300">Kit Upgrade selecionado. Processador e placa-mãe já estão considerados no kit.</div> : incompatible ? <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm leading-6 text-red-300">Atenção: o processador selecionado usa {cpuSocket} e a placa-mãe usa {motherboardSocket}. Essa combinação parece incompatível.</div> : cpuSocket && motherboardSocket ? <div className="mt-5 rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-300">Socket compatível identificado: {cpuSocket}.</div> : <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-xs leading-5 text-zinc-500">A compatibilidade automática é uma ajuda inicial. A Vitória Informática confirma a configuração antes da venda.</div>}
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="mt-5 block rounded-xl bg-green-600 px-5 py-3 text-center font-black hover:bg-green-500">Enviar configuração no WhatsApp</a>
            <button onClick={() => { setSelection({}); setOpenGroup(null); }} disabled={!selectedItems.length} className="mt-3 w-full rounded-xl border border-zinc-700 px-5 py-3 font-bold disabled:cursor-not-allowed disabled:opacity-40 hover:bg-zinc-800">Limpar configuração</button>
          </div>
        </aside>
      </div>)}
    </main>
  );
}
