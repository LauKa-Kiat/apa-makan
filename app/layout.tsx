import type { Metadata, Viewport } from "next";
import { Fraunces, Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Link from "next/link";
import { UtensilsCrossed } from "lucide-react";
import { ThemeSwitcher } from "@/components/theme-switcher";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Apa Makan? — spin to pick where to eat",
  description:
    "Can't decide what to eat? Pick a Malaysian mall, or none at all, and spin the wheel for a random food spot.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fdf9f3" },
    { media: "(prefers-color-scheme: dark)", color: "#15110f" },
  ],
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-display",
  display: "swap",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.className} ${geistSans.variable} ${fraunces.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex min-h-dvh flex-col bg-dots">
            <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
              <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4">
                <Link
                  href="/"
                  className="flex items-center gap-2 font-semibold tracking-tight"
                >
                  <span className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm">
                    <UtensilsCrossed className="size-4" aria-hidden />
                  </span>
                  <span className="font-[family-name:var(--font-display)] text-xl">
                    Apa Makan?
                  </span>
                </Link>
                <ThemeSwitcher />
              </div>
            </header>

            <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:py-12">
              {children}
            </main>

            <footer className="border-t bg-background/80">
              <div className="mx-auto flex w-full max-w-5xl flex-col gap-1 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <p>Shop lists come from each mall&apos;s food directory.</p>
                <p>Selamat makan!</p>
              </div>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
