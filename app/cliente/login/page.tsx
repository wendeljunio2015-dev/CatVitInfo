import Link from "next/link";

export const metadata = { title: "Entrar | Vitória Informática", robots: { index: false, follow: false } };

export default async function CustomerLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const message = error === "exists" ? "Esta conta já possui acesso. Faça login." : error ? "E-mail ou senha inválidos." : "";
  return <main className="mx-auto max-w-md px-6 py-16">
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-7">
      <p className="text-sm font-black uppercase tracking-widest text-blue-400">Área do cliente</p>
      <h1 className="mt-2 text-4xl font-black">Entrar</h1>
      <p className="mt-3 text-zinc-400">Acesse seus dados, pedidos e orçamentos.</p>
      {message ? <p className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm font-bold text-red-300">{message}</p> : null}
      <form action="/api/customer/login" method="post" className="mt-6 space-y-4">
        <div><label className="text-sm font-bold">E-mail</label><input required type="email" name="email" className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" /></div>
        <div><label className="text-sm font-bold">Senha</label><input required type="password" name="password" className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" /></div>
        <button className="w-full rounded-xl bg-blue-600 px-5 py-3 font-black hover:bg-blue-500">Entrar</button>
      </form>
      <p className="mt-6 text-center text-sm text-zinc-400">Ainda não tem conta? <Link href="/cliente/cadastro" className="font-bold text-blue-400">Cadastre-se</Link></p>
    </div>
  </main>;
}
