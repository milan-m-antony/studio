// src/components/layout/Preloader.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

const FALLBACK_TIMEOUT = 7000; // 7 seconds for the preloader to hide if window.load doesn't fire
const CONTENT_FADE_IN_DELAY = 200; // ms, delay before text starts fading in
const PRELOADER_FADE_OUT_DURATION = 500; // ms, for the entire preloader to fade out

export default function Preloader() {
  const [isLoading, setIsLoading] = useState(true); // Controls if the preloader is in the DOM
  const [isFadingOut, setIsFadingOut] = useState(false); // Controls the fade-out animation of the whole preloader
  const [isContentLoaded, setIsContentLoaded] = useState(false); // Controls fade-in of text content
  const fallbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const contentFadeInTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startFadeOut = useCallback(() => {
    if (isFadingOut || !isLoading) return;

    console.log("[Preloader] Starting fade out sequence.");
    setIsFadingOut(true); // Trigger fade-out class for the preloader overlay
    setTimeout(() => {
      console.log("[Preloader] Fade out complete, hiding preloader from DOM.");
      setIsLoading(false); // Remove from DOM after fade
    }, PRELOADER_FADE_OUT_DURATION);
  }, [isLoading, isFadingOut]);

  useEffect(() => {
    // Timer to trigger fade-in of preloader content (MMA, Loading text)
    contentFadeInTimerRef.current = setTimeout(() => {
      setIsContentLoaded(true);
    }, CONTENT_FADE_IN_DELAY);

    // Fallback timer to ensure preloader hides eventually
    fallbackTimerRef.current = setTimeout(() => {
      console.log("[Preloader] Fallback timeout reached.");
      startFadeOut();
    }, FALLBACK_TIMEOUT);

    // Listener for window.load
    const handleWindowLoad = () => {
      console.log("[Preloader] Window loaded.");
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
      }
      startFadeOut();
    };

    if (document.readyState === 'complete') {
      // If already loaded (e.g., fast connection, cached resources), start fade out almost immediately
      // but ensure content has a chance to fade in briefly if desired
      setTimeout(handleWindowLoad, CONTENT_FADE_IN_DELAY + 100);
    } else {
      window.addEventListener('load', handleWindowLoad);
    }

    return () => {
      window.removeEventListener('load', handleWindowLoad);
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
      }
      if (contentFadeInTimerRef.current) {
        clearTimeout(contentFadeInTimerRef.current);
      }
    };
  }, [startFadeOut]);

  if (!isLoading) {
    return null;
  }

  return (
    <div
      id="preloader-overlay"
      className={cn(
        "fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/95 backdrop-blur-sm transition-opacity duration-500 ease-in-out",
        isFadingOut ? "opacity-0" : "opacity-100"
      )}
      aria-hidden={!isLoading || isFadingOut}
      role="status"
    >
      <div className={cn(
        "text-center transition-opacity duration-700 ease-in-out",
        isContentLoaded ? "opacity-100" : "opacity-0"
      )}>
        <div className="text-7xl md:text-8xl lg:text-9xl font-bold text-white tracking-widest">
          MMA
        </div>
        <p className="mt-6 text-lg font-medium text-white/80">
          Loading Portfolio...
        </p>
      </div>
    </div>
  );
}
