// src/components/layout/Preloader.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

// Duration each number is actively displayed (includes its own animation)
const NUMBER_DISPLAY_DURATION_MS = 400; // Reduced from 700ms
// Duration of the zoomInOutNumber animation (should be <= NUMBER_DISPLAY_DURATION_MS)
const PRELOADER_ANIMATION_DURATION_MS = NUMBER_DISPLAY_DURATION_MS * 0.75; // e.g., 300ms

// Max time preloader stays if everything else fails (must be > 3 * NUMBER_DISPLAY_DURATION_MS)
const ABSOLUTE_FALLBACK_TIMEOUT_MS = (NUMBER_DISPLAY_DURATION_MS * 3) + 1000; // e.g., 1200 + 1000 = 2200ms

export default function Preloader() {
  const [isLoading, setIsLoading] = useState(true);
  const [currentNumber, setCurrentNumber] = useState<number>(1);
  
  const sequenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fallbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const windowLoadFiredRef = useRef<boolean>(false);

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
    if (!isLoading) { 
      cleanUpAllTimers();
      return;
    }

    if (currentNumber <= 3) {
      sequenceTimerRef.current = setTimeout(() => {
        if (currentNumber < 3) {
          setCurrentNumber(prev => prev + 1);
        } else { // currentNumber is 3, and its display duration has just elapsed
          setIsLoading(false); 
        }
      }, NUMBER_DISPLAY_DURATION_MS);
    } else {
       // This case should ideally not be reached if currentNumber is managed correctly up to 3
       setIsLoading(false);
    }
    
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
      // If window loads before sequence finishes, we might still wait for sequence
      // or decide to hide earlier. For now, sequence completion is primary.
      // If isLoading is still true AND currentNumber is already > 3 (sequence finished),
      // this ensures it hides.
      if (isLoading && currentNumber > 3) {
         setIsLoading(false);
      }
    };

    fallbackTimerRef.current = setTimeout(() => {
      setIsLoading(currentIsLoadingState => {
        if (currentIsLoadingState) {
          // console.warn("[Preloader] Forcing hide due to absolute fallback timeout.");
          return false;
        }
        return currentIsLoadingState; 
      });
    }, ABSOLUTE_FALLBACK_TIMEOUT_MS);

    if (document.readyState === 'complete') {
      setTimeout(handleWindowLoad, 0);
    } else {
      window.addEventListener('load', handleWindowLoad);
    }

    return () => {
      window.removeEventListener('load', handleWindowLoad);
      cleanUpAllTimers(); 
    };
  }, [isLoading, currentNumber]); // Added isLoading & currentNumber to deps for safety with handleWindowLoad logic

  if (!isLoading) {
    return null;
  }

  return (
    <div
      id="preloader-main-overlay"
      className={cn(
        "fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black text-white",
        // Fade-out is handled by component returning null
      )}
      aria-hidden={!isLoading}
      role="status"
    >
      {currentNumber <= 3 && ( 
        <div 
            className="text-7xl md:text-8xl lg:text-9xl font-bold text-white" 
            style={{ minHeight: '1.2em', minWidth: '1.2em', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <span
            key={currentNumber} 
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
