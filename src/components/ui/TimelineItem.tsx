
"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { TimelineEvent as SupabaseTimelineEvent } from '@/types/supabase';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';
import NextImage from 'next/image';
import React from 'react'; // For React.ElementType

// Default inline SVG placeholder if no icon_image_url is provided
const DefaultTimelineSvgFallback = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor" // Will inherit color from parent
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
        threshold: 0.1, // Trigger when 10% of the item is visible
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

  let IconContent: React.ReactNode;

  if (event.iconImageUrl && typeof event.iconImageUrl === 'string' && event.iconImageUrl.trim() !== '') {
    IconContent = (
      <div className="relative h-full w-full"> {/* Ensure image fills its container */}
        <NextImage
          src={event.iconImageUrl}
          alt={`${event.title} icon`}
          layout="fill"
          objectFit="contain" // Or "cover" depending on desired effect for non-square icons
          className="rounded-full" // If the icon image itself should be circular
        />
      </div>
    );
  } else {
    // Use the default SVG fallback
    IconContent = <DefaultTimelineSvgFallback className="h-6 w-6" />; // Size can be adjusted here
  }

  return (
    <div
      ref={itemRef}
      className={cn(
        "mb-8 flex justify-between items-center w-full transition-all duration-700 ease-out",
        isLeft ? "flex-row-reverse left-timeline" : "right-timeline",
        // Apply animation classes based on visibility
        isVisible ? 'opacity-100 translate-y-0 sm:translate-x-0' : 'opacity-0 translate-y-10 sm:translate-y-0 sm:translate-x-10'
      )}
    >
      <div className="order-1 w-5/12"></div> {/* Spacer */}
      <div className="z-20 flex items-center order-1 shadow-xl w-12 h-12 rounded-full">
        {/* Updated icon container styling */}
        <div className={cn(
            "mx-auto rounded-full w-12 h-12 flex items-center justify-center overflow-hidden",
            "bg-muted border border-border text-primary" // Neutral background, border, primary color for SVG
        )}>
         {IconContent}
        </div>
      </div>
      <div className={cn(
        "order-1 rounded-lg shadow-xl w-5/12 px-6 py-4",
        isLeft ? "bg-secondary text-secondary-foreground" : "bg-card text-card-foreground" // Use card/secondary for content box
      )}>
        <Card className="border-0 shadow-none bg-transparent">
          <CardHeader className="p-0 pb-2">
            <p className="text-sm text-muted-foreground">{event.date}</p>
            <CardTitle className="text-lg font-semibold">{event.title}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-sm text-foreground/80">{event.description}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
