
// src/components/ui/CategoryCard.tsx
import Image from 'next/image';
import { Package as DefaultPackageIconImport, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import React from 'react';

interface CategoryCardProps {
  name: string;
  iconImageUrl: string | null | undefined;
  skillCount: number;
  onClick: () => void;
}

// A very simple hardcoded SVG to use as an ultimate fallback for categories.
const DefaultCategorySvgFallback = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
    <line x1="12" y1="22.08" x2="12" y2="12"></line>
  </svg>
);

export default function CategoryCard({ name, iconImageUrl, skillCount, onClick }: CategoryCardProps) {
  let IconContent: React.ReactNode;

  if (iconImageUrl) {
    IconContent = (
      <div className="relative h-12 w-12 mb-3 rounded-md overflow-hidden">
        <Image
          src={iconImageUrl}
          alt={`${name} category icon`}
          layout="fill"
          objectFit="contain"
          className="transition-transform group-hover:scale-110" // Removed dark mode invert
          data-ai-hint="category icon"
        />
      </div>
    );
  } else {
     IconContent = <DefaultCategorySvgFallback className="h-12 w-12 mx-auto mb-3 transition-transform group-hover:scale-110 text-primary" />;
  }

  return (
    <Card
      className="text-center p-4 hover:shadow-xl transition-shadow duration-300 bg-card cursor-pointer group transform hover:scale-105"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
      aria-label={`View skills in ${name} category`}
    >
      <CardHeader className="pb-2 flex flex-col items-center justify-center">
        {IconContent}
        <CardTitle className="text-xl font-semibold text-foreground mt-1">{name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{skillCount} skill{skillCount !== 1 ? 's' : ''}</p>
        <div className="flex justify-center mt-3">
          <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
        </div>
      </CardContent>
    </Card>
  );
}
