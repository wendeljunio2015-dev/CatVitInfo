function WhatsAppIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M12 2a9.8 9.8 0 0 0-8.4 14.9L2 22l5.3-1.5A9.9 9.9 0 1 0 12 2Zm0 17.9c-1.5 0-3-.4-4.3-1.2l-.3-.2-3.1.9.9-3-.2-.3A7.9 7.9 0 1 1 12 19.9Zm4.3-5.9c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.6.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1-1.4-.7-2.4-1.3-3.3-2.9-.2-.3.2-.3.7-1.1.1-.2.1-.4 0-.6 0-.2-.6-1.5-.9-2-.2-.5-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.2-1.2 2.9s1.2 3.3 1.4 3.5c.2.2 2.4 3.7 5.9 5.2 2.2.9 3.1 1 4.2.8.7-.1 2.1-.9 2.4-1.7.3-.8.3-1.5.2-1.7-.1-.2-.3-.2-.6-.3Z" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950">
      <div className="mx-auto max-w-7xl px-6 py-10 text-sm text-zinc-400">
        <p className="font-bold text-white">Vitória Informática • Goiânia - GO</p>
        <p className="mt-2">Atendimento e orçamento pelo WhatsApp. Consulte disponibilidade e garantia de cada produto.</p>
        <a href="https://wa.me/5562994780830" target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-xs font-black text-white hover:bg-green-500"><WhatsAppIcon />Falar no WhatsApp</a>
        <p className="mt-4">Não realizamos envio para todo o Brasil. Consulte as opções disponíveis para sua região.</p>
      </div>
    </footer>
  );
}
