// src/components/layout/Preloader.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2 } from 'lucide-react';

export default function Preloader() {
  const [loading, setLoading] = useState(true);
  const [fadingOut, setFadingOut] = useState(false);
  const [progress, setProgress] = useState(1); // Start count from 1
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const fallbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearAllTimers = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (fallbackTimeoutRef.current) {
      clearTimeout(fallbackTimeoutRef.current);
      fallbackTimeoutRef.current = null;
    }
  }, []);

  const startFadeOut = useCallback(() => {
    if (fadingOutRef.current) return; // Prevent multiple calls to startFadeOut
    fadingOutRef.current = true; // Signal that fadeOut has started

    clearAllTimers();
    setProgress(100); // Ensure it shows 100 before fading
    setFadingOut(true); // Triggers CSS opacity transition
    
    setTimeout(() => {
      setLoading(false); // Remove from DOM after transition
    }, 500); // Must match CSS transition duration
  }, [clearAllTimers]); // Removed fadingOut from deps as we use a ref

  // Ref to track if fadingOut has already been initiated to prevent race conditions
  const fadingOutRef = useRef(false);

  useEffect(() => {
    fadingOutRef.current = false; // Reset on mount/change that might re-evaluate this
    
    const handleWindowLoad = () => {
      console.log("[Preloader] window.onload triggered");
      startFadeOut();
    };

    fallbackTimeoutRef.current = setTimeout(() => {
      console.warn("[Preloader] Fallback timeout triggered.");
      startFadeOut();
    }, 7000); // Fallback after 7 seconds

    if (document.readyState === 'complete') {
      console.log("[Preloader] Document already complete on mount.");
      startFadeOut();
    } else {
      window.addEventListener('load', handleWindowLoad);
    }

    return () => {
      window.removeEventListener('load', handleWindowLoad);
      clearAllTimers();
    };
  }, [startFadeOut, clearAllTimers]);

  useEffect(() => {
    if (fadingOutRef.current || !loading) { // If already fading or not loading, don't start interval
      if(intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    if (progress < 100) {
      intervalRef.current = setInterval(() => {
        setProgress(prev => {
          const nextProgress = prev + 1;
          if (nextProgress >= 100) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            startFadeOut(); // Start fade out when counter hits 100
            return 100;
          }
          return nextProgress;
        });
      }, 30); // 30ms * 100 = ~3 seconds to count to 100
    } else if (progress >= 100 && loading && !fadingOutRef.current) {
      // If progress somehow got to 100 but fadeout didn't start
      if (intervalRef.current) clearInterval(intervalRef.current);
      startFadeOut();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [progress, loading, startFadeOut]);


  if (!loading) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black text-white transition-opacity duration-500 ease-in-out ${
        fadingOut ? 'opacity-0' : 'opacity-100'
      }`}
      aria-hidden={!loading}
      role="status"
      aria-live="polite"
    >
      <div className="text-center mb-8">
        <span
          key={progress} // Re-trigger animation on progress change
          className="text-7xl md:text-8xl lg:text-9xl font-bold tabular-nums animate-textGlowPopIn inline-block"
          style={{ animationDelay: '0s', animationDuration: '0.2s' }} // Ensure pop-in is quick for each number
        >
          {progress}
        </span>
        {/* Percentage sign removed */}
      </div>
      
      <p className="text-md text-white/80 mb-4">Loading Portfolio...</p>
      <Loader2 className="h-6 w-6 animate-spin text-white/70" />
    </div>
  );
}
