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
  const fadingOutRef = useRef(false); // Ref to prevent multiple fade-out triggers

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
    if (fadingOutRef.current) return;
    fadingOutRef.current = true;

    clearAllTimers();
    setProgress(100); // Ensure it shows 100 before fading
    setFadingOut(true);
    
    setTimeout(() => {
      setLoading(false);
    }, 500); // Match CSS transition duration for opacity
  }, [clearAllTimers]);

  useEffect(() => {
    fadingOutRef.current = false; // Reset on mount
    
    const handleWindowLoad = () => {
      startFadeOut();
    };

    fallbackTimeoutRef.current = setTimeout(() => {
      startFadeOut();
    }, 7000); // Fallback after 7 seconds

    if (document.readyState === 'complete') {
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
    if (fadingOutRef.current || !loading) {
      if(intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    if (progress < 100) {
      intervalRef.current = setInterval(() => {
        setProgress(prev => {
          const nextProgress = prev + 1;
          if (nextProgress >= 100) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            // startFadeOut() will be called by window.onload or fallback,
            // or if the counter naturally hits 100 before those.
            // If it hits 100 naturally, call startFadeOut.
            startFadeOut();
            return 100;
          }
          return nextProgress;
        });
      }, 30); // Approx 3 seconds to count to 100
    } else if (progress >= 100 && loading && !fadingOutRef.current) {
      // This ensures if progress somehow gets to 100 but fadeout didn't start, it will.
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
          className="text-7xl md:text-8xl lg:text-9xl font-bold tabular-nums animate-preloaderPulse inline-block"
          style={{ animationDelay: '0s', animationDuration: '0.2s' }} 
        >
          {progress}
        </span>
      </div>
      
      <p className="text-md text-white/80 mb-4">Loading Portfolio...</p>
      <Loader2 className="h-6 w-6 animate-spin text-white/70" />
    </div>
  );
}
