// src/components/layout/Preloader.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

const FALLBACK_TIMEOUT = 7000; // 7 seconds
const FADE_OUT_DURATION = 500; // ms, for main overlay fade

export default function Preloader() {
  const [isLoading, setIsLoading] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const fallbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startFadeOut = useCallback(() => {
    if (isFadingOut || !isLoading) return; // Prevent multiple calls or if already hidden

    console.log("[Preloader] Starting fade out sequence.");
    setIsFadingOut(true);
    setTimeout(() => {
      console.log("[Preloader] Fade out complete, hiding preloader.");
      setIsLoading(false);
    }, FADE_OUT_DURATION);
  }, [isLoading, isFadingOut]);

  useEffect(() => {
    // Ensure fade-out starts if component is still loading after fallback
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
      handleWindowLoad();
    } else {
      window.addEventListener('load', handleWindowLoad);
    }

    return () => {
      window.removeEventListener('load', handleWindowLoad);
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
      }
    };
  }, [startFadeOut]); // Add startFadeOut to dependencies

  if (!isLoading) {
    return null;
  }

  return (
    <div
      id="preloader-overlay"
      className={cn(
        "fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black transition-opacity duration-500 ease-in-out",
        isFadingOut ? "opacity-0" : "opacity-100"
      )}
      aria-hidden={!isLoading || isFadingOut}
      role="status"
    >
      <div className="relative flex h-24 w-24 items-center justify-center">
        {/* Pulsing Circles */}
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              "absolute h-full w-full rounded-full bg-primary opacity-60",
              "animate-pulseCircle"
            )}
            style={{
              animationDelay: `${i * 0.3}s`,
              // Note: Tailwind's animate-pulse is different. We use custom animate-pulseCircle.
            }}
          />
        ))}
      </div>
      <p className="mt-8 text-lg font-medium text-white/80">Loading Portfolio...</p>
    </div>
  );
}
