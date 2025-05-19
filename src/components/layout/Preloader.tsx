// src/components/layout/Preloader.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2 } from 'lucide-react';

export default function Preloader() {
  const [loading, setLoading] = useState(true);
  const [fadingOut, setFadingOut] = useState(false);
  const fallbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fadingOutRef = useRef(false); // Ref to prevent multiple fade-out triggers

  const clearAllTimers = useCallback(() => {
    if (fallbackTimeoutRef.current) {
      clearTimeout(fallbackTimeoutRef.current);
      fallbackTimeoutRef.current = null;
    }
  }, []);

  const startFadeOut = useCallback(() => {
    if (fadingOutRef.current) return;
    fadingOutRef.current = true;

    clearAllTimers();
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

    // Fallback to hide preloader after a certain time
    fallbackTimeoutRef.current = setTimeout(() => {
      console.log("[Preloader] Fallback timeout reached, starting fade out.");
      startFadeOut();
    }, 7000); // Fallback after 7 seconds

    if (document.readyState === 'complete') {
      console.log("[Preloader] Document already complete, starting fade out.");
      startFadeOut();
    } else {
      window.addEventListener('load', handleWindowLoad);
      console.log("[Preloader] Event listener for 'load' added.");
    }

    return () => {
      window.removeEventListener('load', handleWindowLoad);
      clearAllTimers();
      console.log("[Preloader] Cleanup: Event listener removed, timers cleared.");
    };
  }, [startFadeOut, clearAllTimers]);


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
          className="text-7xl md:text-8xl lg:text-9xl font-bold tracking-wider" // Added tracking-wider for a bit more spacing
        >
          MMA
        </span>
      </div>
      
      <p className="text-md text-white/80 mb-4">Loading Portfolio...</p>
      <Loader2 className="h-6 w-6 animate-spin text-white/70" />
    </div>
  );
}
