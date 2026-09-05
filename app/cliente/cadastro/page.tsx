import Link from "next/link";

export const metadata = { title: "Cadastro | Vitória Informática", robots: { index: false, follow: false } };

const errorMessage: Record<string, string> = {
  invalid: "Preencha os dados corretamente. A senha deve ter pelo menos 8 caracteres.",
  exists: "Já existe uma conta ou cadastro com este e-mail. Entre na sua conta ou fale conosco para confirmar seus dados.",
  phone_exists: "Este WhatsApp já está associado a um cadastro. Fale conosco para confirmar seus dados antes de vincular o histórico.",
  failed: "Não foi possível criar sua conta agora. Confira os dados e tente novamente.",
};

export default async function CustomerRegisterPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <main className="mx-auto max-w-xl px-6 py-16">
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-7">
      <p className="text-sm font-black uppercase tracking-widest text-blue-400">Área do cliente</p>
      <h1 className="mt-2 text-4xl font-black">Criar conta</h1>
      <p className="mt-3 text-zinc-400">Cadastre-se para acompanhar pedidos, orçamentos e seus dados.</p>
      {error ? <p className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm font-bold text-red-300">{errorMessage[error] || errorMessage.failed}</p> : null}
      <form action="/api/customer/register" method="post" className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2"><label className="text-sm font-bold">Nome</label><input required name="name" maxLength={120} className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" /></div>
        <div><label className="text-sm font-bold">E-mail</label><input required type="email" name="email" maxLength={160} className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" /></div>
        <div><label className="text-sm font-bold">WhatsApp</label><input name="phone" inputMode="tel" placeholder="(62) 99999-9999" className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" /></div>
        <div><label className="text-sm font-bold">Cidade</label><input name="city" defaultValue="Goiânia" className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" /></div>
        <div><label className="text-sm font-bold">Senha</label><input required type="password" name="password" minLength={8} autoComplete="new-password" className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" /></div>
        <button className="md:col-span-2 rounded-xl bg-blue-600 px-5 py-3 font-black hover:bg-blue-500">Criar minha conta</button>
      </form>
      <p className="mt-6 text-center text-sm text-zinc-400">Já possui conta? <Link href="/cliente/login" className="font-bold text-blue-400">Entrar</Link></p>
    </div>
  </main>;
}
