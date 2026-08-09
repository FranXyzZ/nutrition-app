import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import { TopBar } from "@/app/components/top-bar";
import { BottomNav } from "@/app/components/bottom-nav";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nutrición — Macros",
  description: "Contador de macros y seguimiento nutricional diario.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${outfit.variable} ${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <TopBar />
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
