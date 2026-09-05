import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, isValidAdminSessionToken } from "@/lib/admin-auth";

export const metadata = {
  title: "Login Administrativo",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (isValidAdminSessionToken(token)) redirect("/admin");

  const { erro } = await searchParams;

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center px-6 py-12">
      <section className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-xl font-black">V</div>
        <p className="mt-6 text-sm font-black uppercase tracking-widest text-blue-400">Vitória Informática</p>
        <h1 className="mt-2 text-3xl font-black">Acesso administrativo</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-400">Área restrita para gerenciamento do catálogo.</p>

        {erro ? <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">Senha incorreta. Tente novamente.</div> : null}

        <form action="/api/admin/login" method="post" className="mt-7 space-y-4">
          <label className="block">
            <span className="text-sm font-bold text-zinc-300">Senha</span>
            <input name="password" type="password" autoComplete="current-password" required className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none focus:border-blue-500" />
          </label>
          <button type="submit" className="w-full rounded-xl bg-blue-600 px-5 py-3 font-black hover:bg-blue-500">Entrar no painel</button>
        </form>
      </section>
    </main>
  );
}
