import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Inpatient Care — Sistem Informasi Rawat Inap & Bed Management",
  description:
    "Hospital Operations Platform — Pemantauan, Pengelolaan Ketersediaan Tempat Tidur, dan Alokasi Kamar Rawat Inap",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${plusJakarta.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-800 antialiased selection:bg-emerald-500/20 selection:text-emerald-950">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
