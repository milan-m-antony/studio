
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SectionWrapper from '@/components/ui/SectionWrapper'; // Optional: for consistent loading look
import SectionTitle from '@/components/ui/SectionTitle'; // Optional

export default function AdminRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/dashboard');
  }, [router]);

  return (
    <SectionWrapper>
      <SectionTitle subtitle="Please wait...">Redirecting</SectionTitle>
      <div className="flex justify-center items-center h-64">
        <p className="text-muted-foreground">Redirecting to admin area...</p>
      </div>
    </SectionWrapper>
  );
}
