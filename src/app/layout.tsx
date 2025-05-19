
import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/contexts/ThemeProvider';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Toaster } from "@/components/ui/toaster";
import { Geist, Geist_Mono } from 'next/font/google';
import { supabase } from '@/lib/supabaseClient'; // Import Supabase client
import type { LegalDocument } from '@/types/supabase'; // Import LegalDocument type

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
};

async function getLegalDocument(id: string): Promise<LegalDocument | null> {
  console.log(`[RootLayout] Fetching legal document with ID: ${id}`);
  const { data, error } = await supabase
    .from('legal_documents')
    .select('id, title, content, updated_at')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error(`[RootLayout] Error fetching legal document ${id}:`, JSON.stringify(error, null, 2));
    return null;
  }
  if (data) {
    console.log(`[RootLayout] Successfully fetched document: ${data.title} (updated: ${data.updated_at})`);
  } else {
    console.log(`[RootLayout] No document found for ID: ${id}`);
  }
  return data;
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const termsDoc = await getLegalDocument('terms-and-conditions');
  const privacyDoc = await getLegalDocument('privacy-policy');

  console.log('[RootLayout] Rendering with termsDoc title:', termsDoc?.title, 'and privacyDoc title:', privacyDoc?.title);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Favicon link tags - pointing to favicon_io subfolder */}
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon_io/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon_io/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon_io/favicon-16x16.png" />
        <link rel="manifest" href="/favicon_io/site.webmanifest" />
        <link rel="icon" href="/favicon_io/favicon.ico" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow">{children}</main>
            <Footer termsContentData={termsDoc} privacyPolicyData={privacyDoc} />
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
