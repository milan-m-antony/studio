
import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Using Inter as a fallback or primary, Geist is specified in CSS
import './globals.css';
import { ThemeProvider } from '@/contexts/ThemeProvider';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Toaster } from "@/components/ui/toaster";
import { Geist, Geist_Mono } from 'next/font/google';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});


export const metadata: Metadata = {
  title: "Milan's Portfolio - Creative Developer",
  description: 'Personal portfolio of Milan, a creative developer showcasing projects, skills, and journey.',
  // Next.js 13+ App Router handles basic favicon.ico automatically if placed in app/favicon.ico or public/favicon.ico
  // For other icons and manifest, we can add them here or directly in the JSX head.
  // For simplicity and direct control as per your favicon.io instructions, we'll add them to the JSX head.
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Favicon link tags from favicon.io */}
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        {/* 
          Note: Next.js App Router typically handles favicon.ico automatically if it's in /app/favicon.ico or /public/favicon.ico.
          The link tag <link rel="icon" href="/favicon.ico" /> is often not needed explicitly for just favicon.ico.
          However, including it as per favicon.io instructions is fine. If you have /app/favicon.ico, it will likely take precedence.
        */}
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow">{children}</main>
            <Footer />
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
