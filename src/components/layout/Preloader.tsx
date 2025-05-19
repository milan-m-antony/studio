// src/components/layout/Preloader.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

export default function Preloader() {
  const [loading, setLoading] = useState(true);
  const [fadingOut, setFadingOut] = useState(false);
  const [progress, setProgress] = useState(1); // Start count from 1
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
    clearTimeoutsAndIntervals(); 
    setProgress(100); 
    setFadingOut(true);
    setTimeout(() => {
      setLoading(false);
    }, 500); 
  };

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev < 99) { 
          return prev + 1;
        }
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        return 99;
      });
    }, 30); 

    fallbackTimeoutRef.current = setTimeout(() => {
      console.warn("Preloader: Fallback timeout triggered to hide preloader.");
      if (!fadingOut && loading) { 
        handleLoad();
      }
    }, 7000); 

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
  }, [fadingOut, loading]);

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
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black text-white transition-opacity duration-500 ease-in-out ${
        fadingOut ? 'opacity-0' : 'opacity-100'
      }`}
      aria-hidden={!loading}
      role="status"
      aria-live="polite"
    >
      <div className="text-center mb-8">
        <span
          key={progress} 
          className="text-7xl md:text-8xl lg:text-9xl font-bold tabular-nums animate-textGlowPopIn inline-block" // Changed animation class
        >
          {progress}
        </span>
        <span className="text-4xl md:text-5xl lg:text-6xl font-light text-white/80">%</span>
      </div>
      
      <p className="text-md text-white/80 mb-4">Loading Portfolio...</p>
      <Loader2 className="h-6 w-6 animate-spin text-white/70" />
    </div>
  );
}
