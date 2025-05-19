// src/components/layout/Preloader.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

export default function Preloader() {
  const [loading, setLoading] = useState(true);
  const [fadingOut, setFadingOut] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const fallbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimeoutsAndIntervals = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (fallbackTimeoutRef.current) {
      clearTimeout(fallbackTimeoutRef.current);
      fallbackTimeoutRef.current = null;
    }
  };

  const handleLoad = () => {
    clearTimeoutsAndIntervals(); // Clear everything once load is handled
    setProgress(100); // Jump to 100%
    setFadingOut(true);
    setTimeout(() => {
      setLoading(false);
    }, 500); // This duration should match your CSS transition duration
  };

  useEffect(() => {
    // Start counter animation
    intervalRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev < 99) {
          return prev + 1;
        }
        // Once it reaches 99, stop the interval, but don't hide yet
        // The window.onload or fallback will push it to 100
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        return 99;
      });
    }, 30); // Adjust interval for speed (e.g., 30ms for ~3s to 99%)

    // Fallback timeout in case window.onload is very slow
    fallbackTimeoutRef.current = setTimeout(() => {
      console.warn("Preloader: Fallback timeout triggered to hide preloader.");
      if (!fadingOut && loading) { // Only if not already handled
        handleLoad();
      }
    }, 7000); // Hide after 7 seconds regardless

    if (document.readyState === 'complete') {
      if (!fadingOut && loading) {
        handleLoad();
      }
    } else {
      window.addEventListener('load', handleLoad);
    }

    return () => {
      window.removeEventListener('load', handleLoad);
      clearTimeoutsAndIntervals();
    };
  }, []); // Empty dependency array, runs once on mount and cleans up on unmount

  // Effect to stop counter if component unmounts while interval is active
  useEffect(() => {
    return () => {
      clearTimeoutsAndIntervals();
    }
  }, []);


  if (!loading) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background transition-opacity duration-500 ease-in-out ${
        fadingOut ? 'opacity-0' : 'opacity-100'
      }`}
      aria-hidden={!loading}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <div className="text-2xl font-semibold text-primary">
        {progress}%
      </div>
      <p className="mt-2 text-sm text-muted-foreground">Loading Portfolio...</p>
    </div>
  );
}
