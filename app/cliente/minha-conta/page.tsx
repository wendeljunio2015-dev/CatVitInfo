import { getDatabase } from "@netlify/database";
import { requireCustomer } from "@/lib/customer-auth";

export const metadata = { title: "Minha conta | Vitória Informática", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const statusLabel: Record<string,string> = { novo:"Novo", em_atendimento:"Em atendimento", concluido:"Concluído", cancelado:"Cancelado" };
const profileMessage: Record<string,string> = {
  saved: "Dados atualizados com sucesso.",
  invalid: "Confira seu nome e e-mail.",
  email_exists: "Este e-mail já está associado a outro cadastro.",
  phone_exists: "Este WhatsApp já está associado a outro cadastro.",
  failed: "Não foi possível atualizar seus dados agora.",
};
const passwordMessage: Record<string,string> = {
  saved: "Senha alterada com sucesso.",
  invalid: "A nova senha deve ter pelo menos 8 caracteres e a confirmação deve ser igual.",
  wrong: "A senha atual informada está incorreta.",
  failed: "Não foi possível alterar sua senha agora.",
};

export default async function MyAccountPage({ searchParams }: { searchParams: Promise<{ profile?: string; password?: string }> }) {
  const customerId = await requireCustomer();
  const { profile, password } = await searchParams;
  const db = getDatabase();
  const customers = await db.sql`SELECT id,name,email,phone,document,city,created_at,last_login_at FROM customers WHERE id=${customerId} LIMIT 1`;
  if (!customers.length) return null;
  const customer: any = customers[0];
  const orders = await db.sql`SELECT id,order_number,items,total,status,created_at FROM orders WHERE customer_id=${customerId} ORDER BY created_at DESC LIMIT 100`;
  const money = new Intl.NumberFormat("pt-BR", { style:"currency", currency:"BRL" });
  const date = new Intl.DateTimeFormat("pt-BR", { dateStyle:"short", timeStyle:"short", timeZone:"America/Sao_Paulo" });
  const completed = orders.filter((order:any) => String(order.status) === "concluido");
  const completedTotal = completed.reduce((sum:number, order:any) => sum + Number(order.total || 0), 0);

  return <main className="mx-auto max-w-6xl px-6 py-12">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-sm font-black uppercase tracking-widest text-blue-400">Área do cliente</p><h1 className="mt-2 text-4xl font-black">Olá, {String(customer.name)}</h1><p className="mt-3 text-zinc-400">Acompanhe seu histórico e mantenha seus dados atualizados.</p></div>
      <form action="/api/customer/logout" method="post"><button className="rounded-lg border border-red-500/30 px-3 py-2 text-sm font-bold text-red-300 hover:bg-red-500/10">Sair</button></form>
    </div>

    <div className="mt-10 grid gap-5 sm:grid-cols-3">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"><p className="text-sm text-zinc-400">Pedidos / orçamentos</p><p className="mt-2 text-4xl font-black">{orders.length}</p></div>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"><p className="text-sm text-zinc-400">Compras concluídas</p><p className="mt-2 text-4xl font-black text-green-400">{completed.length}</p></div>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"><p className="text-sm text-zinc-400">Total concluído</p><p className="mt-2 text-3xl font-black text-blue-400">{money.format(completedTotal)}</p></div>
    </div>

    <div className="mt-10 grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-2xl font-black">Meus dados</h2>
        {profile ? <p className={`mt-4 rounded-xl border p-3 text-sm font-bold ${profile === "saved" ? "border-green-500/20 bg-green-500/10 text-green-300" : "border-red-500/20 bg-red-500/10 text-red-300"}`}>{profileMessage[profile] || profileMessage.failed}</p> : null}
        <form action="/api/customer/profile" method="post" className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><label className="text-sm font-bold">Nome</label><input required name="name" maxLength={120} defaultValue={String(customer.name || "")} className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" /></div>
          <div><label className="text-sm font-bold">E-mail</label><input required type="email" name="email" maxLength={160} defaultValue={String(customer.email || "")} className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" /></div>
          <div><label className="text-sm font-bold">WhatsApp</label><input name="phone" inputMode="tel" defaultValue={String(customer.phone || "")} className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" /></div>
          <div className="sm:col-span-2"><label className="text-sm font-bold">Cidade</label><input name="city" defaultValue={String(customer.city || "")} className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" /></div>
          <button className="sm:col-span-2 rounded-xl bg-blue-600 px-5 py-3 font-black hover:bg-blue-500">Salvar meus dados</button>
        </form>
        {customer.document ? <p className="mt-4 text-xs text-zinc-500">CPF/CNPJ cadastrado: {String(customer.document)}. Para alterar esse dado, entre em contato com a loja.</p> : null}
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-2xl font-black">Alterar senha</h2>
        <p className="mt-2 text-sm text-zinc-400">Use pelo menos 8 caracteres na nova senha.</p>
        {password ? <p className={`mt-4 rounded-xl border p-3 text-sm font-bold ${password === "saved" ? "border-green-500/20 bg-green-500/10 text-green-300" : "border-red-500/20 bg-red-500/10 text-red-300"}`}>{passwordMessage[password] || passwordMessage.failed}</p> : null}
        <form action="/api/customer/password" method="post" className="mt-5 grid gap-4">
          <div><label className="text-sm font-bold">Senha atual</label><input required type="password" name="currentPassword" autoComplete="current-password" className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" /></div>
          <div><label className="text-sm font-bold">Nova senha</label><input required type="password" name="newPassword" minLength={8} autoComplete="new-password" className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" /></div>
          <div><label className="text-sm font-bold">Confirmar nova senha</label><input required type="password" name="confirmPassword" minLength={8} autoComplete="new-password" className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" /></div>
          <button className="rounded-xl border border-blue-500/40 px-5 py-3 font-black text-blue-300 hover:bg-blue-500/10">Alterar senha</button>
        </form>
      </section>
    </div>

    <section className="mt-10"><h2 className="text-2xl font-black">Histórico de compras e orçamentos</h2><div className="mt-5 space-y-4">{orders.length === 0 ? <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-zinc-400">Você ainda não possui pedidos ou orçamentos vinculados à sua conta.</div> : orders.map((order:any) => { const items = Array.isArray(order.items) ? order.items : []; return <article key={String(order.id)} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"><div className="flex flex-wrap justify-between gap-4"><div><h3 className="text-xl font-black">{String(order.order_number)}</h3><p className="mt-1 text-sm text-zinc-400">{date.format(new Date(String(order.created_at)))} • {statusLabel[String(order.status)] || String(order.status)}</p></div><strong className="text-xl text-blue-400">{money.format(Number(order.total))}</strong></div><div className="mt-4 space-y-2 rounded-xl bg-zinc-950 p-4">{items.map((item:any,index:number) => <div key={index} className="flex justify-between gap-4 text-sm"><span>{Number(item.quantity)}x {String(item.name)}</span><span>{money.format(Number(item.subtotal))}</span></div>)}</div></article>; })}</div></section>
  </main>;
}
