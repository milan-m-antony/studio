// src/components/ui/SkillCard.tsx
import Image from 'next/image';
import * as LucideIcons from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { Skill } from '@/types/supabase';
import { cn } from '@/lib/utils';
import React from 'react';

interface SkillCardProps {
  skill: Skill;
}

// A very simple hardcoded SVG to use as an ultimate fallback for skills.
const DefaultSkillSvgFallback = (props: React.SVGProps<SVGSVGElement>) => (
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
    <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
    <rect x="9" y="9" width="6" height="6" />
    <line x1="9" y1="1" x2="9" y2="4" /><line x1="15" y1="1" x2="15" y2="4" />
    <line x1="9" y1="20" x2="9" y2="23" /><line x1="15" y1="20" x2="15" y2="23" />
    <line x1="20" y1="9" x2="23" y2="9" /><line x1="20" y1="14" x2="23" y2="14" />
    <line x1="1" y1="9" x2="4" y2="9" /><line x1="1" y1="14" x2="4" y2="14" />
  </svg>
);


export default function SkillCard({ skill }: SkillCardProps) {
  let IconContent: React.ReactNode;

  if (skill.iconImageUrl) {
    IconContent = (
      <div className="relative h-12 w-12 mb-1 rounded-md overflow-hidden">
        <Image
          src={skill.iconImageUrl}
          alt={`${skill.name} icon`}
          layout="fill"
          objectFit="contain"
          className="transition-transform group-hover:scale-110 dark:filter dark:brightness-0 dark:invert"
          data-ai-hint="skill icon"
        />
      </div>
    );
  } else {
    // Attempt to use Lucide icon if iconName is provided and valid
    let IconToRender: React.ElementType | null = null;
    const defaultLucideIconName = 'Cpu'; // Default Lucide icon if specific one fails

    if (skill.iconName && typeof skill.iconName === 'string' && skill.iconName.trim() !== '') {
      const FoundIcon = LucideIcons[skill.iconName as keyof typeof LucideIcons];
      if (FoundIcon && typeof FoundIcon === 'function') {
        IconToRender = FoundIcon;
      } else {
        console.warn(
          `SkillCard: Lucide icon "${skill.iconName}" for skill "${skill.name}" not found or invalid. Attempting default Lucide icon.`
        );
      }
    }

    if (!IconToRender) { // If specific icon wasn't found or no name provided, try default Lucide
      const DefaultLucide = LucideIcons[defaultLucideIconName as keyof typeof LucideIcons];
      if (DefaultLucide && typeof DefaultLucide === 'function') {
        IconToRender = DefaultLucide;
      } else {
         console.warn(
          `SkillCard: Default Lucide icon "${defaultLucideIconName}" for skill "${skill.name}" also not found or invalid. Rendering hardcoded SVG fallback.`
        );
      }
    }
    
    if (IconToRender && typeof IconToRender === 'function') {
        IconContent = <IconToRender className="h-10 w-10 sm:h-12 sm:w-12 text-primary mb-1 transition-transform group-hover:scale-110" />;
    } else {
        // Ultimate fallback to inline SVG
        console.error(`SkillCard: Critical fallback for skill "${skill.name}". Lucide icon resolution failed. Rendering inline SVG.`);
        IconContent = <DefaultSkillSvgFallback className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-1 transition-transform group-hover:scale-110" />;
    }
  }
  
  return (
    <Card className={cn(
      "text-center p-4 hover:shadow-xl transition-all duration-300 h-full flex flex-col items-center group transform hover:scale-105",
      "bg-card/80 backdrop-blur-md"
    )}>
      <CardContent className="flex flex-col items-center justify-start gap-3 pt-4 sm:pt-5 md:pt-6 flex-grow w-full">
        {IconContent}
        <p className="text-sm sm:text-base font-semibold text-foreground">{skill.name}</p>
        {skill.description && (
          <p className="text-xs text-muted-foreground mt-2 text-center px-1 sm:px-2 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out h-auto max-h-0 group-hover:max-h-40 overflow-hidden">
            {skill.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
