import type { Metadata } from "next";
import Link from "next/link";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FormIt",
  description:
    "Convert batches of images between JPG, PNG, WEBP, and more without losing control of quality.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${outfit.variable} antialiased`}
      >
        <div className="relative min-h-screen">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(242,116,87,0.35),transparent_70%)] blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute left-[-12%] top-80 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(246,196,83,0.3),transparent_70%)] blur-3xl"
          />
          <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 pb-6 pt-8">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[color:var(--accent)] text-sm font-semibold text-white shadow-[var(--shadow-sm)]">
                FI
              </span>
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-[color:var(--muted)]">
                  FormIt
                </p>
                <p className="text-lg font-semibold text-[color:var(--foreground)]">
                  Image Converter
                </p>
              </div>
            </div>
            <nav className="flex items-center gap-6 text-sm font-medium text-[color:var(--muted)]">
              <Link className="transition hover:text-[color:var(--foreground)]" href="/">
                Home
              </Link>
              <Link className="transition hover:text-[color:var(--foreground)]" href="/contact">
                Contact
              </Link>
            </nav>
          </header>
          <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-16 pt-4">
            {children}
          </main>
          <footer className="mx-auto w-full max-w-6xl px-6 pb-10 text-sm text-[color:var(--muted)]">
            Built for fast, high-quality image conversions.
          </footer>
        </div>
      </body>
    </html>
  );
}
