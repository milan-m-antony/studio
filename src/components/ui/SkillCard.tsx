// src/components/ui/SkillCard.tsx
"use client"; // Needs to be a client component for useEffect

import NextImage from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import type { Skill } from '@/types/supabase';
import { cn } from '@/lib/utils';
import React, { useEffect } from 'react'; // Import useEffect
import * as LucideIcons from 'lucide-react'; // For dynamic primary icon fallback
import { HelpCircle as UltimateFallbackIcon } from 'lucide-react'; // Explicit import for ultimate fallback
import { supabase } from '@/lib/supabaseClient'; // Import Supabase client

// Default inline SVG placeholder if dynamic/default Lucide icons fail
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
    <line x1="9" y1="1" x2="9" y2="4" /><line x1="15" y1="1" x2="15" y2="4" />
    <line x1="9" y1="20" x2="9" y2="23" /><line x1="15" y1="20" x2="15" y2="23" />
    <line x1="20" y1="9" x2="23" y2="9" /><line x1="20" y1="14" x2="23" y2="14" />
    <line x1="1" y1="9" x2="4" y2="9" /><line x1="1" y1="14" x2="4" y2="14" />
  </svg>
);

interface SkillCardProps {
  skill: Skill;
}

export default function SkillCard({ skill }: SkillCardProps) {
  let IconToShow: React.ElementType | null = null;
  const DefaultIconFromName = LucideIcons['Cpu'] as React.ElementType; // Hardcoded default if icon_image_url is missing

  if (skill.iconImageUrl && typeof skill.iconImageUrl === 'string' && skill.iconImageUrl.trim() !== '') {
    // Use NextImage for URL-based icons
  } else if (skill.iconName && typeof skill.iconName === 'string' && skill.iconName.trim() !== '') {
    // Fallback to Lucide icon name if URL is not present
    const FoundIcon = LucideIcons[skill.iconName as keyof typeof LucideIcons] as React.ElementType;
    if (FoundIcon && typeof FoundIcon === 'function') {
      IconToShow = FoundIcon;
    } else {
      console.warn(`SkillCard: Lucide icon "${skill.iconName}" for skill "${skill.name}" not found. Using default (Cpu).`);
      IconToShow = DefaultIconFromName || UltimateFallbackIcon;
    }
  } else {
    // If no URL and no iconName, use the default hardcoded Lucide icon
    IconToShow = DefaultIconFromName || UltimateFallbackIcon;
  }
  
  if (IconToShow && typeof IconToShow !== 'function') {
      console.error(`SkillCard Critical Error: IconToShow resolved to something not a function for skill "${skill.name}". IconToShow value:`, IconToShow);
      IconToShow = UltimateFallbackIcon; // Ultimate fallback
  }
  if (typeof IconToShow !== 'function' && !skill.iconImageUrl) { // If even ultimate fallback fails, render SVG
     console.error(`SkillCard Panic: Ultimate fallback icon (HelpCircle) is also not a function for skill "${skill.name}". Rendering inline SVG.`);
  }

  // Log skill interaction (view) when the card mounts
  useEffect(() => {
    if (skill && skill.id) {
      const logSkillInteraction = async () => {
        // console.log(`[SkillCard] Attempting to log view for skill ID: ${skill.id}, Name: ${skill.name}`);
        const { error } = await supabase
          .from('skill_interactions')
          .insert({ 
            skill_id: skill.id,
            interaction_type: 'view' // Log as a 'view' interaction
          });
        if (error) {
          console.warn(`[SkillCard] Failed to log interaction for skill ${skill.name} (ID: ${skill.id}):`, error.message);
        } else {
          // console.log(`[SkillCard] Logged 'view' interaction for skill ${skill.name}`);
        }
      };
      logSkillInteraction();
    }
  }, [skill]); // Dependency array includes skill

  return (
    <Card className={cn(
      "text-center p-4 hover:shadow-xl transition-all duration-300 h-full flex flex-col items-center group transform hover:scale-105",
      "bg-card/80 backdrop-blur-md"
    )}>
      <CardContent className="flex flex-col items-center justify-start gap-3 pt-4 sm:pt-5 md:pt-6 flex-grow w-full">
        {skill.iconImageUrl ? (
          <div className="relative h-12 w-12 mb-1 rounded-md overflow-hidden bg-muted">
            <NextImage
              src={skill.iconImageUrl}
              alt={`${skill.name || 'Skill'} icon`}
              layout="fill"
              objectFit="contain" // Changed from 'cover' to 'contain' for icons
              className="transition-transform group-hover:scale-110"
              // Removed dark:filter dark:brightness-0 dark:invert to show original colors
            />
          </div>
        ) : IconToShow ? (
          <IconToShow className="h-10 w-10 sm:h-12 sm:w-12 text-primary mb-1 transition-transform group-hover:scale-110" />
        ) : (
          <DefaultSkillSvgFallback className="h-10 w-10 sm:h-12 sm:w-12 text-primary mb-1 transition-transform group-hover:scale-110" />
        )}
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
