import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { getCatalogProductById } from "@/lib/catalog-db";
import { productCategories } from "@/data/categories";
import AdminImageInput from "@/components/AdminImageInput";

export const metadata = { title: "Editar produto", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function EditProductPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  await requireAdmin(); const { id } = await params; const { saved } = await searchParams;
  const product = await getCatalogProductById(id); if (!product) notFound();
  const images = product.images ?? (product.image ? [product.image] : []); const remainingSlots = Math.max(0, 5 - images.length);
  return <main className="mx-auto max-w-5xl px-6 py-12">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-black uppercase tracking-widest text-blue-400">Painel administrativo</p><h1 className="mt-2 text-4xl font-black">Editar produto</h1><p className="mt-3 text-zinc-400">Altere informações, estoque, especificações e fotos.</p></div><Link href="/admin" className="rounded-xl border border-zinc-700 px-5 py-3 font-bold">← Voltar ao painel</Link></div>
    {saved === "1" && <div className="mt-6 rounded-2xl border border-green-500/20 bg-green-500/10 p-4 font-bold text-green-300">Produto atualizado com sucesso.</div>}
    <form action={`/api/admin/products/${encodeURIComponent(product.id)}`} method="post" encType="multipart/form-data" className="mt-8 grid gap-5 rounded-3xl border border-zinc-800 bg-zinc-900 p-6 md:grid-cols-2 md:p-8">
      <div><label className="text-sm font-bold text-zinc-300">Nome do produto</label><input required name="name" defaultValue={product.name} className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"/></div>
      <div><label className="text-sm font-bold text-zinc-300">Categoria</label><select required name="category" defaultValue={product.category} className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3">{productCategories.map(c => <option key={c}>{c}</option>)}</select></div>
      <div><label className="text-sm font-bold text-zinc-300">Preço</label><input required name="price" type="number" min="0" step="0.01" defaultValue={product.price} className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"/></div>
      <div><label className="text-sm font-bold text-zinc-300">Garantia</label><input name="warranty" defaultValue={product.warranty ?? ""} className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"/></div>
      <div><label className="text-sm font-bold text-zinc-300">Quantidade em estoque</label><input required name="stockQuantity" type="number" min="0" step="1" defaultValue={product.stockQuantity ?? (product.stockStatus === "indisponivel" ? 0 : 1)} className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"/><p className="mt-2 text-xs text-zinc-500">0 = Indisponível • 1–2 = Últimas unidades • 3+ = Em estoque</p></div>
      <div><label className="text-sm font-bold text-zinc-300">Selo</label><select name="badge" defaultValue={product.badge ?? ""} className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"><option value="">Sem selo</option><option>Novo</option><option>Promoção</option><option>Destaque</option></select></div>
      <div className="md:col-span-2"><label className="text-sm font-bold text-zinc-300">Descrição</label><textarea name="description" rows={5} defaultValue={product.description} className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"/></div>
      <div className="md:col-span-2"><label className="text-sm font-bold text-zinc-300">Especificações técnicas</label><textarea name="specs" rows={7} defaultValue={(product.specs ?? []).join("\n")} className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"/><p className="mt-2 text-xs text-zinc-500">Uma especificação por linha.</p></div>
      <div className="md:col-span-2"><div className="flex items-end justify-between gap-4"><div><h2 className="text-lg font-black">Fotos atuais</h2><p className="mt-1 text-sm text-zinc-500">Escolha a principal ou marque imagens para remover.</p></div><span className="text-sm font-bold text-zinc-400">{images.length}/5 fotos</span></div>{images.length ? <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">{images.map((url,index)=><div key={url} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-2"><div className="relative aspect-square overflow-hidden rounded-xl"><img src={url} alt={`${product.name} - foto ${index+1}`} className="h-full w-full object-contain"/>{index===0&&<span className="absolute left-2 top-2 rounded-full bg-blue-600 px-2 py-1 text-[10px] font-black">Principal atual</span>}</div><label className="mt-2 flex items-center gap-2 text-xs text-blue-300"><input type="radio" name="primaryImage" value={url} defaultChecked={index===0}/> Principal</label><label className="mt-2 flex items-center gap-2 text-xs text-red-300"><input type="checkbox" name="removeImages" value={url}/> Remover</label></div>)}</div>:<div className="mt-4 rounded-xl border border-dashed border-zinc-700 p-5 text-sm text-zinc-500">Este produto ainda não possui fotos.</div>}</div>
      {remainingSlots>0?<AdminImageInput maxFiles={remainingSlots}/>:<p className="md:col-span-2 text-sm text-zinc-500">Remova uma foto e salve para liberar espaço.</p>}
      <label className="flex items-center gap-3 md:col-span-2"><input type="checkbox" name="featured" defaultChecked={product.featured}/><span className="font-bold">Mostrar como destaque</span></label>
      <div className="flex flex-wrap gap-3 md:col-span-2"><button className="rounded-xl bg-blue-600 px-6 py-3 font-black hover:bg-blue-500">Salvar alterações</button><Link href={`/produto/${product.slug}`} target="_blank" className="rounded-xl border border-zinc-700 px-6 py-3 font-bold">Ver produto</Link></div>
    </form>
  </main>;
}
