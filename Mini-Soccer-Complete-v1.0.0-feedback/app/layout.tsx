import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mini Soccer Complete",
  description: "Fútbol arcade 4v4, 5v5 y 6v6 con inteligencia colectiva, torneos, selecciones, clubes y modo temporada.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
