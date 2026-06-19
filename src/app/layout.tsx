import type { Metadata } from "next";
import Link from "next/link";
import { Inter, Unbounded } from "next/font/google";
import { AuthProvider } from "@/lib/authContext";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const unbounded = Unbounded({
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
        className={`${inter.variable} ${unbounded.variable} antialiased`}
      >
        <AuthProvider>
          <div className="relative min-h-screen">
            <div
              aria-hidden
              className="glow-accent pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full blur-3xl"
            />
            <div
              aria-hidden
              className="glow-gold pointer-events-none absolute -left-32 top-80 h-80 w-80 rounded-full blur-3xl"
            />
            <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 pb-6 pt-8">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-sm font-semibold text-white shadow-formit-sm">
                  FI
                </span>
                <div>
                  <p className="brand-label text-sm uppercase text-muted">

                    FormIt
                  </p>
                  <p className="text-lg font-semibold text-foreground">
                    Image Converter
                  </p>
                </div>
              </div>
              <nav className="flex items-center gap-6 text-sm font-medium text-muted">
                <Link className="transition hover:text-foreground" href="/">
                  Home
                </Link>
                <Link className="transition hover:text-foreground" href="/contact">
                  Contact
                </Link>
                <Link className="transition hover:text-foreground" href="/auth">
                  Login
                </Link>
              </nav>
            </header>
            <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-16 pt-4">
              {children}
            </main>
            <footer className="mx-auto w-full max-w-6xl px-6 pb-10 text-sm text-muted">
              Built for fast, high-quality image conversions.
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
