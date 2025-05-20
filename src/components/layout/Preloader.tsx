// src/components/layout/Preloader.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

const NUMBER_DISPLAY_DURATION_MS = 700; // How long each number (1, 2, 3) animation is shown
const PRELOADER_ANIMATION_DURATION_MS = NUMBER_DISPLAY_DURATION_MS * 0.8; // Animation slightly shorter than display duration
const FALLBACK_TIMEOUT_MS = 5000; // Max time preloader stays if window.load fails

export default function Preloader() {
  const [isLoading, setIsLoading] = useState(true);
  const [currentNumber, setCurrentNumber] = useState<number>(1);
  const loadHandlerCalled = useRef(false);

  const handleLoadSequenceEnd = useCallback(() => {
    if (loadHandlerCalled.current) return;
    loadHandlerCalled.current = true;
    console.log("[Preloader] Load sequence end triggered. Hiding preloader.");
    setIsLoading(false);
  }, []);

  // Effect for the 1, 2, 3 counting sequence
  useEffect(() => {
    if (!isLoading) return; // Stop counting if preloader is already set to hide

    if (currentNumber > 3) {
      handleLoadSequenceEnd();
      return;
    }

    const timer = setTimeout(() => {
      setCurrentNumber(prev => prev + 1);
    }, NUMBER_DISPLAY_DURATION_MS);

    return () => clearTimeout(timer);
  }, [currentNumber, isLoading, handleLoadSequenceEnd]);

  // Effect for window.onload and fallback timeout
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      console.log("[Preloader] Fallback timeout reached.");
      if (isLoading) { // Check if still loading before forcing hide
        handleLoadSequenceEnd();
      }
    }, FALLBACK_TIMEOUT_MS);

    const handleWindowLoad = () => {
      console.log("[Preloader] Window loaded.");
      clearTimeout(fallbackTimer);
      if (isLoading) { // Check if still loading before forcing hide
         handleLoadSequenceEnd();
      }
    };

    if (document.readyState === 'complete') {
      // If already loaded, trigger after a very short delay to allow initial render
      setTimeout(handleWindowLoad, 50);
    } else {
      window.addEventListener('load', handleWindowLoad);
    }

    return () => {
      window.removeEventListener('load', handleWindowLoad);
      clearTimeout(fallbackTimer);
    };
  }, [isLoading, handleLoadSequenceEnd]);


  if (!isLoading) {
    return null;
  }

  return (
    <>
      {/* Main dark overlay */}
      <div
        id="preloader-main-overlay"
        className={cn(
          "fixed inset-0 z-[9999] flex items-center justify-center bg-black text-white",
          // This overlay will just pop out when isLoading becomes false
        )}
        aria-hidden={!isLoading}
        role="status"
      >
        {currentNumber <= 3 && (
          <div className="text-7xl md:text-8xl lg:text-9xl font-bold text-white" style={{ minHeight: '1.2em', minWidth: '1.2em', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span
              key={currentNumber} // Re-trigger animation for each number
              className="inline-block animate-zoomInOutNumber" // Uses existing zoom animation
              style={{ animationDuration: `${PRELOADER_ANIMATION_DURATION_MS}ms` }}
            >
              {currentNumber}
            </span>
          </div>
        )}
      </div>
    </>
  );
}
