import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import SiteChrome from "@/components/SiteChrome";

export const metadata: Metadata = {
  metadataBase: new URL("https://catvitinfo.netlify.app"),
  title: {
    default: "Vitória Informática | Informática em Goiânia",
    template: "%s | Vitória Informática",
  },
  description: "Catálogo online da Vitória Informática em Goiânia - GO. Processadores, kits upgrade, SSDs, memórias e componentes para computador.",
  applicationName: "Vitória Informática",
  keywords: ["Vitória Informática", "informática Goiânia", "peças para computador", "processadores", "SSD", "memória RAM", "kit upgrade"],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Vitória Informática",
    title: "Vitória Informática | Informática em Goiânia",
    description: "Tecnologia, componentes e orçamento rápido pelo WhatsApp em Goiânia - GO.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#09090b",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>
          <SiteChrome>{children}</SiteChrome>
        </Providers>
      </body>
    </html>
  );
}
