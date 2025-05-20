// src/components/layout/Preloader.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

const NUMBER_DISPLAY_DURATION_MS = 500; // How long each number (1, 2, 3) is shown (including its animation)
const REVEAL_ANIMATION_DURATION_MS = 500; // Duration for the cover and uncover animations each
const FALLBACK_TIMEOUT_MS = 7000; // Max time preloader stays if window.load fails

type PreloaderStage = 'counting' | 'covering' | 'uncovering' | 'hidden';

export default function Preloader() {
  const [isLoading, setIsLoading] = useState(true); // Controls if the component renders at all
  const [stage, setStage] = useState<PreloaderStage>('counting');
  const [currentNumber, setCurrentNumber] = useState<number>(1);
  const fadeOutInitiated = useRef(false);
  const revealPaneRef = useRef<HTMLDivElement>(null);

  const startRevealSequence = useCallback(() => {
    if (fadeOutInitiated.current) return;
    fadeOutInitiated.current = true;
    console.log("[Preloader] Starting reveal sequence. Stage: covering.");
    setStage('covering');
  }, []);

  // Effect for the 1, 2, 3 counting sequence
  useEffect(() => {
    if (stage !== 'counting') return;

    if (currentNumber > 3) {
      startRevealSequence();
      return;
    }

    const timer = setTimeout(() => {
      setCurrentNumber(prev => prev + 1);
    }, NUMBER_DISPLAY_DURATION_MS);

    return () => clearTimeout(timer);
  }, [currentNumber, stage, startRevealSequence]);

  // Effect for window.onload and fallback timeout
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      console.log("[Preloader] Fallback timeout reached.");
      if (!fadeOutInitiated.current) startRevealSequence();
    }, FALLBACK_TIMEOUT_MS);

    const handleWindowLoad = () => {
      console.log("[Preloader] Window loaded.");
      clearTimeout(fallbackTimer);
      if (!fadeOutInitiated.current) startRevealSequence();
    };

    if (document.readyState === 'complete') {
      setTimeout(handleWindowLoad, 100); // Short delay if already loaded
    } else {
      window.addEventListener('load', handleWindowLoad);
    }

    return () => {
      window.removeEventListener('load', handleWindowLoad);
      clearTimeout(fallbackTimer);
    };
  }, [startRevealSequence]);

  // Effect to handle animation end of reveal panes
  useEffect(() => {
    const pane = revealPaneRef.current;
    if (!pane) return;

    const handleAnimationEnd = () => {
      console.log(`[Preloader] Animation ended for stage: ${stage}`);
      if (stage === 'covering') {
        setStage('uncovering');
      } else if (stage === 'uncovering') {
        // After uncover, hide the entire preloader component
        setIsLoading(false);
        setStage('hidden');
         console.log("[Preloader] Preloader sequence complete, hiding.");
      }
    };

    pane.addEventListener('animationend', handleAnimationEnd);
    return () => {
      pane.removeEventListener('animationend', handleAnimationEnd);
    };
  }, [stage]);


  if (!isLoading) {
    return null;
  }

  return (
    <>
      {/* Main dark overlay, always present until the very end */}
      <div
        id="preloader-main-overlay"
        className={cn(
          "fixed inset-0 z-[9998] flex items-center justify-center bg-black text-white",
          // This overlay will just pop out when isLoading becomes false
        )}
        aria-hidden={!isLoading}
        role="status"
      >
        {stage === 'counting' && (
          <div className="text-7xl md:text-8xl lg:text-9xl font-bold text-white" style={{ minHeight: '1.2em', minWidth: '1.2em', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {currentNumber <= 3 && (
              <span
                key={currentNumber} // Re-trigger animation for each number
                className="inline-block animate-zoomInOutNumber" // Uses existing zoom animation
                style={{ animationDuration: `${NUMBER_DISPLAY_DURATION_MS * 0.8}ms` }} // Animation slightly shorter than display duration
              >
                {currentNumber}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Reveal Pane - only active during covering and uncovering stages */}
      {(stage === 'covering' || stage === 'uncovering') && (
        <div
          ref={revealPaneRef}
          id="reveal-pane"
          className={cn(
            "fixed inset-x-0 bottom-0 z-[9999] h-0 bg-primary", // Use primary color for reveal
            {
              'animate-cover-screen': stage === 'covering',
              'animate-uncover-screen': stage === 'uncovering',
            }
          )}
          style={{ animationDuration: `${REVEAL_ANIMATION_DURATION_MS}ms` }}
        />
      )}
    </>
  );
}
