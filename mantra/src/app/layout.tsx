import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mentra — The Collaborative Academic OS",
  description: "Where academic knowledge lives and grows. Host, collaborate, and evolve educational content with your university community.",
  keywords: ["education", "academic", "collaboration", "courses", "knowledge", "university", "stacks"],
  openGraph: {
    title: "Mentra — The Collaborative Academic OS",
    description: "Where academic knowledge lives and grows.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Be+Vietnam+Pro:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full antialiased bg-background text-on-background">
        {children}
      </body>
    </html>
  );
}
