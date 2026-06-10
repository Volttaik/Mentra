import type { Metadata, Viewport } from "next";
import "./globals.css";
import SessionProvider from "@/components/providers/SessionProvider";
import ThemeProvider from "@/components/providers/ThemeProvider";
import MobileNav from "@/components/layout/MobileNav";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import FloatingAgent from "@/components/FloatingAgent";

export const metadata: Metadata = {
  title: "Mentra — The Collaborative Academic OS",
  description:
    "Where academic knowledge lives and grows. Host, collaborate, and evolve educational content with your university community.",
  keywords: [
    "education",
    "academic",
    "collaboration",
    "courses",
    "knowledge",
    "university",
    "stacks",
  ],
  openGraph: {
    title: "Mentra — The Collaborative Academic OS",
    description: "Where academic knowledge lives and grows.",
    type: "website",
    siteName: "Mentra",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Mentra",
  },
};

export const viewport: Viewport = {
  themeColor: "#735b25",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Be+Vietnam+Pro:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="icon" href="/icons/icon-192.png" type="image/png" />
        <style dangerouslySetInnerHTML={{ __html: `html{background:#faf7f2}html.dark{background:#13100b}` }} />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('mentra-theme');var p=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(t===null&&p)){document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){});})}`,
          }}
        />
      </head>
      <body className="min-h-full antialiased bg-background text-on-background">
        <ThemeProvider>
          <SessionProvider>
            {children}
            <MobileNav />
            <PWAInstallPrompt />
            <FloatingAgent />
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
