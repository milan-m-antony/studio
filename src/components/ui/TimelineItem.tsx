// src/components/ui/TimelineItem.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { TimelineEvent as SupabaseTimelineEvent } from '@/types/supabase';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';
import * as LucideIcons from 'lucide-react';
import React from 'react';

// A very simple hardcoded SVG to use as an ultimate fallback for timeline items.
const DefaultTimelineSvgFallback = (props: React.SVGProps<SVGSVGElement>) => (
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
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
  </svg>
);

interface TimelineItemProps {
  event: SupabaseTimelineEvent;
  isLeft: boolean;
}

export default function TimelineItem({ event, isLeft }: TimelineItemProps) {
  let IconToRender: React.ElementType | null = null;
  const defaultLucideIconName = 'Star'; // Default Lucide icon for timeline items

  if (event.iconName && typeof event.iconName === 'string' && event.iconName.trim() !== '') {
    const FoundIcon = LucideIcons[event.iconName as keyof typeof LucideIcons];
    if (FoundIcon && typeof FoundIcon === 'function') {
      IconToRender = FoundIcon;
    } else {
      console.warn(
        `TimelineItem: Lucide icon "${event.iconName}" for event "${event.title}" not found or invalid. Attempting default Lucide icon.`
      );
    }
  }

  if (!IconToRender) { // If specific icon wasn't found or no name provided, try default Lucide
    const DefaultLucide = LucideIcons[defaultLucideIconName as keyof typeof LucideIcons];
    if (DefaultLucide && typeof DefaultLucide === 'function') {
      IconToRender = DefaultLucide;
    } else {
       console.warn(
        `TimelineItem: Default Lucide icon "${defaultLucideIconName}" for event "${event.title}" also not found or invalid. Rendering hardcoded SVG fallback.`
      );
    }
  }

  let FinalIconComponent: React.ElementType;
  if (IconToRender && typeof IconToRender === 'function') {
    FinalIconComponent = IconToRender;
  } else {
    // Ultimate fallback to inline SVG
    console.error(`TimelineItem: Critical fallback for event "${event.title}". Lucide icon resolution failed. Rendering inline SVG.`);
    FinalIconComponent = DefaultTimelineSvgFallback;
  }

  const colors = {
    work: 'bg-blue-500',
    education: 'bg-green-500',
    certification: 'bg-yellow-500',
    milestone: 'bg-purple-500',
    default: 'bg-gray-500',
  };
  const typeColor = colors[event.type as keyof typeof colors] || colors.default;

  const [isVisible, setIsVisible] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: 0.1,
      }
    );

    const currentRef = itemRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  return (
    <div
      ref={itemRef}
      className={cn(
        "mb-8 flex justify-between items-center w-full",
        isLeft ? "flex-row-reverse left-timeline" : "right-timeline",
        isVisible ? 'animate-fadeIn' : 'opacity-0 translate-y-5'
      )}
      style={{ transition: 'opacity 0.5s ease-out, transform 0.5s ease-out', animationDelay: isVisible ? '0s': '0.2s' }}
    >
      <div className="order-1 w-5/12"></div>
      <div className="z-20 flex items-center order-1 shadow-xl w-12 h-12 rounded-full">
        <div className={cn("mx-auto rounded-full w-12 h-12 flex items-center justify-center text-white", typeColor)}>
         <FinalIconComponent className="h-6 w-6" />
        </div>
      </div>
      <div className={cn("order-1 rounded-lg shadow-xl w-5/12 px-6 py-4", isLeft ? "bg-secondary" : "bg-card")}>
        <Card className="border-0 shadow-none bg-transparent">
          <CardHeader className="p-0 pb-2">
            <p className="text-sm text-muted-foreground">{event.date}</p>
            <CardTitle className="text-lg font-semibold text-foreground">{event.title}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-sm text-foreground/80">{event.description}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
