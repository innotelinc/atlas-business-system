import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Atlas Business System — Start Your U.S. Business",
  description:
    "Form an LLC, for-profit corporation, or non-profit in all 50 states. Filing fees, name checks, incorporation documents, and a client portal with a business startup checklist.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-950 text-sm font-bold text-gold-400">
                A
              </span>
              <span className="text-lg font-bold tracking-tight text-brand-950">
                Atlas <span className="text-brand-600">Business System</span>
              </span>
            </Link>
            <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
              <Link href="/formation" className="hover:text-brand-700">
                Form a Business
              </Link>
              <Link href="/#services" className="hover:text-brand-700">
                Services
              </Link>
              <Link href="/#how-it-works" className="hover:text-brand-700">
                How it works
              </Link>
            </nav>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-medium text-slate-600 hover:text-brand-700"
              >
                Sign in
              </Link>
              <Link
                href="/formation"
                className="rounded-lg bg-brand-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800"
              >
                Start your business
              </Link>
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="font-medium text-slate-600">
              © {new Date().getFullYear()} Atlas Business System
            </p>
            <p>Business formation in all 50 U.S. states — LLC, For-Profit, and Non-Profit.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
