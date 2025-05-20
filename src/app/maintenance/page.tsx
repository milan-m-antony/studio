
// src/app/maintenance/page.tsx
import { createClient } from '@supabase/supabase-js';
import { type Metadata } from 'next';
import { Geist } from 'next/font/google';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

// These should be available as they are NEXT_PUBLIC_
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const ADMIN_SITE_SETTINGS_ID = 'global_settings';

export const metadata: Metadata = {
  title: 'Under Maintenance',
  description: 'Our site is currently undergoing scheduled maintenance.',
};

async function getMaintenanceMessage(): Promise<string> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Maintenance Page: Supabase URL or Anon Key is not defined.');
    return 'We are currently performing scheduled maintenance. Please check back soon.';
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('maintenance_message')
      .eq('id', ADMIN_SITE_SETTINGS_ID)
      .single(); // Use single as we expect it to exist

    if (error) {
      console.error('Maintenance Page: Error fetching maintenance message:', error.message);
      return 'We are currently performing scheduled maintenance. We will be back online shortly.';
    }
    return data?.maintenance_message || 'The site is currently undergoing maintenance. We appreciate your patience.';
  } catch (e) {
    console.error('Maintenance Page: Exception fetching maintenance message:', e);
    return 'An error occurred while fetching the maintenance status. Please try again later.';
  }
}

export default async function MaintenancePage() {
  const message = await getMaintenanceMessage();

  return (
    <html lang="en" className={geistSans.variable}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Under Maintenance</title>
        <style>{`
          body { margin: 0; font-family: var(--font-geist-sans), Arial, sans-serif; background-color: #111827; color: #e5e7eb; display: flex; justify-content: center; align-items: center; min-height: 100vh; text-align: center; padding: 20px; box-sizing: border-box; }
          .container { max-width: 600px; }
          h1 { font-size: 2.5rem; margin-bottom: 1rem; color: #f9fafb; }
          p { font-size: 1.125rem; line-height: 1.75; color: #d1d5db; }
          svg { width: 80px; height: 80px; margin-bottom: 1.5rem; color: #60a5fa; }
        `}</style>
      </head>
      <body>
        <div className="container">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <h1>Under Maintenance</h1>
          <p>{message}</p>
        </div>
      </body>
    </html>
  );
}
