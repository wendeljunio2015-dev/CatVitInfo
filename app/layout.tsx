import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vitória Informática",
  description: "Tecnologia com qualidade, garantia e o melhor preço.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
