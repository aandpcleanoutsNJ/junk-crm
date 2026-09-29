import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { LanguageProvider } from "@/components/LanguageProvider";
import LanguageToggle from "@/components/LanguageToggle";
import { getServerLang } from "@/lib/i18n-server";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Junk Helpers",
  description: "Job tracker for the field crew.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Junk Helpers",
  },
  // Favicon and iOS home-screen icon come from src/app/icon.png and
  // src/app/apple-icon.png (Next's file-based icon convention) — no need
  // to list them here too.
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#007fcd",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const lang = await getServerLang();

  return (
    <html lang={lang} className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <LanguageProvider initialLang={lang}>
          <LanguageToggle />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
