
// src/components/layout/Preloader.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

// Duration of the zoomInOutNumber animation for EACH number
const PRELOADER_ANIMATION_DURATION_MS = 300; // Fast animation for each number
// Duration each number is 'active' before the next number is triggered or sequence ends.
// Setting this equal to the animation duration for seamless transition.
const NUMBER_DISPLAY_DURATION_MS = PRELOADER_ANIMATION_DURATION_MS;

// Fallback to hide preloader if window.onload is too slow or sequence gets stuck
// Ensure this is longer than the total sequence time (3 * NUMBER_DISPLAY_DURATION_MS) + a buffer
const ABSOLUTE_FALLBACK_TIMEOUT_MS = (NUMBER_DISPLAY_DURATION_MS * 3) + 500; // e.g., (300*3) + 500 = 1400ms

export default function Preloader() {
  const [isLoading, setIsLoading] = useState(true);
  const [currentNumber, setCurrentNumber] = useState<number>(1); // Start count from 1

  const sequenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fallbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const windowLoadFiredRef = useRef<boolean>(false);
  const hidePreloaderCalled = useRef<boolean>(false); // To prevent multiple calls to setIsLoading(false)

  const cleanUpAllTimers = useCallback(() => {
    if (sequenceTimerRef.current) {
      clearTimeout(sequenceTimerRef.current);
    }
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
    }
  }, []);

  // Effect for the 1, 2, 3 counting sequence
  useEffect(() => {
    if (!isLoading) { // If preloader is already set to hide, do nothing
      cleanUpAllTimers();
      return;
    }

    if (currentNumber <= 3) {
      // This timer is for transitioning to the NEXT number OR hiding the preloader
      sequenceTimerRef.current = setTimeout(() => {
        if (currentNumber < 3) {
          setCurrentNumber(prev => prev + 1);
        } else { // currentNumber is 3, and its display duration has just elapsed
          if (!hidePreloaderCalled.current) { // Ensure hide is called only once
            // console.log("[Preloader] Sequence 1-2-3 completed. Hiding preloader.");
            hidePreloaderCalled.current = true;
            setIsLoading(false); // Main way to hide after sequence
          }
        }
      }, NUMBER_DISPLAY_DURATION_MS);
    } else {
      // Should not be reached if currentNumber is managed up to 3 then isLoading becomes false
      if (isLoading && !hidePreloaderCalled.current) {
        // console.log("[Preloader] currentNumber > 3 and still loading, forcing hide.");
        hidePreloaderCalled.current = true;
        setIsLoading(false);
      }
    }
    
    return () => {
      if (sequenceTimerRef.current) {
        clearTimeout(sequenceTimerRef.current);
      }
    };
  }, [currentNumber, isLoading, cleanUpAllTimers]);

  // Effect for window.onload and absolute fallback
  useEffect(() => {
    const handleWindowLoad = () => {
      if (windowLoadFiredRef.current) return;
      windowLoadFiredRef.current = true;
      // console.log("[Preloader] Window loaded.");
      // If sequence hasn't finished, let it finish.
      // If sequence is done, this won't do much as isLoading might already be false.
      // This mainly acts as a signal if the sequence is somehow stuck and fallback is also late.
      if (isLoading && currentNumber > 3 && !hidePreloaderCalled.current) {
        // console.log("[Preloader] Window loaded after sequence should have ended. Hiding.");
        hidePreloaderCalled.current = true;
        setIsLoading(false);
      }
    };

    fallbackTimerRef.current = setTimeout(() => {
      // console.log("[Preloader] Absolute fallback timeout reached.");
      if (isLoading && !hidePreloaderCalled.current) { // Check isLoading before forcing
        // console.warn("[Preloader] Forcing hide due to absolute fallback timeout.");
        hidePreloaderCalled.current = true;
        setIsLoading(false);
      }
    }, ABSOLUTE_FALLBACK_TIMEOUT_MS);

    if (document.readyState === 'complete') {
      setTimeout(handleWindowLoad, 0); // Handle if already loaded
    } else {
      window.addEventListener('load', handleWindowLoad);
    }

    return () => {
      window.removeEventListener('load', handleWindowLoad);
      cleanUpAllTimers(); // Ensure all timers are cleared on unmount
    };
  }, [isLoading, currentNumber, cleanUpAllTimers]); // Added currentNumber to dependencies

  if (!isLoading) {
    return null;
  }

  return (
    <div
      id="preloader-main-overlay"
      className={cn(
        "fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black text-white",
        // Fade-out is handled by component returning null (unmounting)
      )}
      aria-hidden={!isLoading}
      role="status"
    >
      {/* Display current number (1, 2, or 3) */}
      {currentNumber <= 3 && (
        <div 
          className="text-7xl md:text-8xl lg:text-9xl font-bold text-white"
          style={{ minHeight: '1.2em', minWidth: '1.2em', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <span
            key={currentNumber} // Important: Causes re-render and animation restart for each number
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
