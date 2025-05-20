// src/components/layout/Preloader.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2 } from 'lucide-react';

export default function Preloader() {
  const [loading, setLoading] = useState(true);
  const [fadingOut, setFadingOut] = useState(false);
  const [progress, setProgress] = useState(1); // Start count from 1

  const fallbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const fadingOutRef = useRef(false);

  const clearAllTimers = useCallback(() => {
    if (fallbackTimeoutRef.current) {
      clearTimeout(fallbackTimeoutRef.current);
      fallbackTimeoutRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startFadeOut = useCallback(() => {
    if (fadingOutRef.current) return;
    fadingOutRef.current = true;

    clearAllTimers();
    setProgress(100); // Ensure counter hits 100
    setFadingOut(true);
    
    setTimeout(() => {
      setLoading(false);
    }, 500); // Match CSS transition duration for opacity
  }, [clearAllTimers]);

  useEffect(() => {
    fadingOutRef.current = false; 

    const handleWindowLoad = () => {
      console.log("[Preloader] Window loaded, starting fade out.");
      startFadeOut();
    };

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

  useEffect(() => {
    if (fadingOutRef.current) return; // Don't start new interval if already fading out

    intervalRef.current = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 100) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          // The startFadeOut should be triggered by onload or fallback,
          // but if counter reaches 100 naturally first, ensure fadeOut starts.
          if (!fadingOutRef.current) startFadeOut();
          return 100;
        }
        return prevProgress + 1;
      });
    }, 30); // Adjust speed as needed (30ms for a quick count to 100)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [startFadeOut]);


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
        {/* Display the animated number */}
        <span
          key={progress} // Re-trigger animation on progress change
          className="animate-preloaderPulse text-7xl md:text-8xl lg:text-9xl font-bold"
          style={{ animationDelay: '0s', animationDuration: '0.2s' }} // Ensure animation plays quickly for each number
        >
          {progress}
        </span>
      </div>
      
      <p className="text-md text-white/80 mb-4">Loading Portfolio...</p>
      <Loader2 className="h-6 w-6 animate-spin text-white/70" />
    </div>
  );
}
