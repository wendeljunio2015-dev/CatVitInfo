function WhatsAppIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M12 2a9.8 9.8 0 0 0-8.4 14.9L2 22l5.3-1.5A9.9 9.9 0 1 0 12 2Zm0 17.9c-1.5 0-3-.4-4.3-1.2l-.3-.2-3.1.9.9-3-.2-.3A7.9 7.9 0 1 1 12 19.9Zm4.3-5.9c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.6.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1-1.4-.7-2.4-1.3-3.3-2.9-.2-.3.2-.3.7-1.1.1-.2.1-.4 0-.6 0-.2-.6-1.5-.9-2-.2-.5-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.2-1.2 2.9s1.2 3.3 1.4 3.5c.2.2 2.4 3.7 5.9 5.2 2.2.9 3.1 1 4.2.8.7-.1 2.1-.9 2.4-1.7.3-.8.3-1.5.2-1.7-.1-.2-.3-.2-.6-.3Z" />
    </svg>
  );
}

function InstagramIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>;
}

function LocationIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>;
}

const storeLocationUrl = "https://share.google/Gunuz7hpOrBmtrTol";
const storeMapEmbedUrl = "https://www.google.com/maps?q=Vit%C3%B3ria%20Inform%C3%A1tica%2C%20Goi%C3%A2nia%20GO%2C%2074475-070&output=embed";

export default function Footer() {
  return (
    <footer className="w-full min-w-0 overflow-x-hidden border-t border-zinc-800 bg-zinc-950">
      <div className="mx-auto w-full max-w-7xl min-w-0 px-4 py-10 text-sm text-zinc-400 sm:px-6">
        <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start">
          <div className="min-w-0">
            <p className="font-bold text-white">Vitória Informática • Goiânia - GO</p>
            <p className="mt-2 break-words leading-6">Atendimento e orçamento pelo WhatsApp. Consulte disponibilidade e garantia de cada produto.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a href="/whatsapp" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-xs font-black text-white hover:bg-green-500"><WhatsAppIcon />WhatsApp</a>
              <a href="https://www.instagram.com/vitoria_infor/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-pink-500/40 px-3 py-2 text-xs font-black text-pink-300 hover:bg-pink-500/10"><InstagramIcon />Instagram</a>
            </div>
            <p className="mt-5 break-words leading-6">Não realizamos envio para todo o Brasil. Consulte as opções disponíveis para sua região.</p>
          </div>

          <section aria-labelledby="store-location-title" className="min-w-0 w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 shadow-xl shadow-black/10 sm:p-5">
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-widest text-blue-400">Nossa localização</p>
                <h2 id="store-location-title" className="mt-1 break-words text-lg font-black text-white">Vitória Informática em Goiânia</h2>
              </div>
              <a href={storeLocationUrl} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-green-950/30 hover:bg-green-500"><LocationIcon />Abrir no GPS</a>
            </div>

            <div className="mt-4 w-full min-w-0 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950">
              <div className="relative h-[240px] w-full min-w-0 sm:h-auto sm:aspect-video">
                <iframe
                  src={storeMapEmbedUrl}
                  title="Mapa da localização da Vitória Informática em Goiânia"
                  className="absolute inset-0 block h-full max-w-full w-full border-0"
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
            <p className="mt-3 break-words text-xs leading-5 text-zinc-500">Use o botão acima para abrir a rota diretamente no Google Maps do celular.</p>
          </section>
        </div>
      </div>
    </footer>
  );
}
