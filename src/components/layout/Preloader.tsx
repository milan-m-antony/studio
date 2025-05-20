// src/components/layout/Preloader.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
// Removed Loader2 as it's no longer used in this design

const PRELOADER_NUMBER_INTERVAL = 60; // ms - How frequently a new number starts its animation
const PRELOADER_ANIMATION_DURATION_MS = 400; // ms - Duration of one number's zoom in/out animation
const FALLBACK_TIMEOUT = 7000; // Max time preloader stays if window.load fails
const PRELOADER_FADE_OUT_DURATION_MS = 500; // Duration of the final preloader fade-out

export default function Preloader() {
  const [isLoading, setIsLoading] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [progress, setProgress] = useState(1);
  const fadeOutInitiated = useRef(false); // To prevent multiple fade-out triggers

  const startFadeOut = useCallback(() => {
    if (fadeOutInitiated.current) return;
    fadeOutInitiated.current = true;

    console.log("[Preloader] Starting fade out sequence.");
    setProgress(100); // Ensure counter shows 100 before fading
    setIsFadingOut(true);
    setTimeout(() => {
      console.log("[Preloader] Fade out complete, hiding preloader from DOM.");
      setIsLoading(false);
    }, PRELOADER_FADE_OUT_DURATION_MS);
  }, []);

  useEffect(() => { // For window.onload and fallback timeout
    const fallbackTimer = setTimeout(() => {
      console.log("[Preloader] Fallback timeout reached.");
      if (!fadeOutInitiated.current) startFadeOut();
    }, FALLBACK_TIMEOUT);

    const handleWindowLoad = () => {
      console.log("[Preloader] Window loaded.");
      clearTimeout(fallbackTimer);
      if (!fadeOutInitiated.current) startFadeOut();
    };

    if (document.readyState === 'complete') {
      setTimeout(handleWindowLoad, 100); // Short delay if already loaded
    } else {
      window.addEventListener('load', handleWindowLoad);
    }

    return () => {
      window.removeEventListener('load', handleWindowLoad);
      clearTimeout(fallbackTimer);
    };
  }, [startFadeOut]);

  useEffect(() => { // For the number counter
    if (progress < 100 && !fadeOutInitiated.current) {
      const timer = setTimeout(() => {
        setProgress(prev => prev + 1);
      }, PRELOADER_NUMBER_INTERVAL);
      return () => clearTimeout(timer);
    } else if (progress >= 100 && !fadeOutInitiated.current) {
      // If counter reaches 100 naturally, trigger fade out
      startFadeOut();
    }
  }, [progress, startFadeOut]);

  if (!isLoading) {
    return null;
  }

  return (
    <div
      id="preloader-overlay"
      className={cn(
        "fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black text-white transition-opacity duration-500 ease-in-out",
        isFadingOut ? "opacity-0" : "opacity-100"
      )}
      aria-hidden={!isLoading || isFadingOut}
      role="status"
    >
      <div className="text-7xl md:text-8xl lg:text-9xl font-bold text-white" style={{ minHeight: '1.2em', minWidth: '1.2em', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Each number gets its own span with a key to re-trigger the animation */}
        <span
          key={progress}
          className="inline-block animate-zoomInOutNumber"
          style={{ animationDuration: `${PRELOADER_ANIMATION_DURATION_MS}ms` }}
        >
          {progress}
        </span>
      </div>
      {/* Optional: Add "Loading..." text if desired, for now, focusing on the number
      <p className="mt-6 text-lg font-medium text-white/80">
        Loading Portfolio...
      </p>
      */}
    </div>
  );
}
