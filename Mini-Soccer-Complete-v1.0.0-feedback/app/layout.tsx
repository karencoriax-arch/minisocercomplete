import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./mobile.css";
import MobileJoystick from "./mobile-joystick";

export const metadata: Metadata = {
  title: "Mini Soccer Complete",
  applicationName: "Mini Soccer Complete",
  description: "Fútbol arcade móvil 3v3 y 4v4 con inteligencia colectiva, torneos, selecciones, clubes y modo temporada.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Mini Soccer Complete",
  },
  other: {
    "codex-preview": "development",
    "mobile-web-app-capable": "yes",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#071008",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">
        {children}
        <MobileJoystick />
      </body>
    </html>
  );
}
