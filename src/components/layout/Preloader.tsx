// src/components/layout/Preloader.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

// Duration each number is actively displayed (includes its own animation)
const NUMBER_DISPLAY_DURATION_MS = 700;
// Duration of the zoomInOutNumber animation (should be <= NUMBER_DISPLAY_DURATION_MS)
const PRELOADER_ANIMATION_DURATION_MS = NUMBER_DISPLAY_DURATION_MS * 0.8; // e.g., 560ms

// Max time preloader stays if everything else fails (must be > 3 * NUMBER_DISPLAY_DURATION_MS)
const ABSOLUTE_FALLBACK_TIMEOUT_MS = (NUMBER_DISPLAY_DURATION_MS * 3) + 2000; // e.g., 2100 + 2000 = 4100ms

export default function Preloader() {
  const [isLoading, setIsLoading] = useState(true);
  const [currentNumber, setCurrentNumber] = useState<number>(1);
  
  const sequenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fallbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const windowLoadFiredRef = useRef<boolean>(false); // To track if window.load has fired

  const cleanUpAllTimers = () => {
    if (sequenceTimerRef.current) {
      clearTimeout(sequenceTimerRef.current);
    }
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
    }
  };

  // Effect for the 1, 2, 3 counting sequence
  useEffect(() => {
    if (!isLoading) { // If preloader is already hiding/hidden, do nothing.
      cleanUpAllTimers();
      return;
    }

    if (currentNumber <= 3) {
      // This timer is for the duration each number is shown.
      // After this duration, we either move to the next number or finish.
      console.log(`[Preloader] Displaying number: ${currentNumber}`);
      sequenceTimerRef.current = setTimeout(() => {
        if (currentNumber < 3) {
          setCurrentNumber(prev => prev + 1);
        } else { // currentNumber is 3, and its display duration has just elapsed
          console.log("[Preloader] Sequence 1-2-3 visually complete. Hiding preloader.");
          setIsLoading(false); // This is the primary way to hide.
        }
      }, NUMBER_DISPLAY_DURATION_MS);
    }
    // If currentNumber > 3, it means setIsLoading(false) was already called or will be by fallback.

    return () => {
      if (sequenceTimerRef.current) {
        clearTimeout(sequenceTimerRef.current);
      }
    };
  }, [currentNumber, isLoading]);

  // Effect for window.onload and absolute fallback
  useEffect(() => {
    const handleWindowLoad = () => {
      if (windowLoadFiredRef.current) return;
      windowLoadFiredRef.current = true;
      console.log("[Preloader] Window loaded event fired.");
      // This event no longer directly hides the preloader.
      // It sets a flag that *could* be used by the sequence logic if needed,
      // but the current sequence logic aims to complete 1-2-3 regardless.
    };

    // Fallback to hide preloader if it gets stuck (e.g., sequence logic error)
    fallbackTimerRef.current = setTimeout(() => {
      console.log("[Preloader] Absolute fallback timeout reached.");
      setIsLoading(currentIsLoadingState => {
        if (currentIsLoadingState) {
          console.warn("[Preloader] Forcing hide due to absolute fallback timeout.");
          return false;
        }
        return currentIsLoadingState; // No change if already false
      });
    }, ABSOLUTE_FALLBACK_TIMEOUT_MS);

    if (document.readyState === 'complete') {
      // If already complete, set the flag.
      // Using setTimeout to ensure it runs after initial render cycle and state setup.
      setTimeout(handleWindowLoad, 0);
    } else {
      window.addEventListener('load', handleWindowLoad);
    }

    return () => {
      window.removeEventListener('load', handleWindowLoad);
      cleanUpAllTimers();
    };
  }, []); // Runs once on mount to setup listeners and fallback

  if (!isLoading) {
    return null;
  }

  return (
    <div
      id="preloader-main-overlay"
      className={cn(
        "fixed inset-0 z-[9999] flex items-center justify-center bg-black text-white",
        // The fade-out is handled by the component returning null when isLoading is false.
        // If a CSS fade-out is desired, we'd need another state like 'isFadingOut'.
      )}
      aria-hidden={!isLoading}
      role="status"
    >
      {currentNumber <= 3 && ( // Only render the number if it's 1, 2, or 3
        <div className="text-7xl md:text-8xl lg:text-9xl font-bold text-white" style={{ minHeight: '1.2em', minWidth: '1.2em', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span
            key={currentNumber} // Re-trigger animation for each number
            className="inline-block animate-zoomInOutNumber"
            style={{ animationDuration: `${PRELOADER_ANIMATION_DURATION_MS}ms` }}
          >
            {currentNumber}
          </span>
        </div>
      )}
    </div>
  );
}
