// src/components/layout/Preloader.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

const COUNTDOWN_MAX = 100;
const COUNTDOWN_INTERVAL = 30; // ms, for ~3 second countdown (30ms * 100 = 3000ms)
const FALLBACK_TIMEOUT = 7000; // 7 seconds
const FADE_DURATION = 500; // ms, for main overlay fade

type PreloaderStage = 'counting' | 'covering' | 'uncovering' | 'fadingOutOverlay' | 'hidden';

export default function Preloader() {
  const [stage, setStage] = useState<PreloaderStage>('counting');
  const [progress, setProgress] = useState(1);
  const [mainOverlayOpacity, setMainOverlayOpacity] = useState(1);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const fallbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const revealPaneRef = useRef<HTMLDivElement>(null);

  const clearTimers = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
  }, []);

  const startRevealSequence = useCallback(() => {
    clearTimers();
    setProgress(COUNTDOWN_MAX); // Ensure counter shows 100
    if (stage === 'counting') {
      setStage('covering');
    }
  }, [stage, clearTimers]);

  // Effect for the countdown
  useEffect(() => {
    if (stage === 'counting') {
      intervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev < COUNTDOWN_MAX) {
            return prev + 1;
          }
          clearInterval(intervalRef.current!);
          // The startRevealSequence will be called by onload or fallback
          return COUNTDOWN_MAX;
        });
      }, COUNTDOWN_INTERVAL);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [stage]);

  // Effect for window.onload and fallback timeout
  useEffect(() => {
    if (stage !== 'counting') return;

    const handleWindowLoad = () => {
      console.log("[Preloader] Window loaded, starting reveal sequence.");
      startRevealSequence();
    };

    if (document.readyState === 'complete') {
      handleWindowLoad();
    } else {
      window.addEventListener('load', handleWindowLoad);
      fallbackTimerRef.current = setTimeout(() => {
        console.log("[Preloader] Fallback timeout, starting reveal sequence.");
        handleWindowLoad(); // Also call handleWindowLoad to ensure sequence starts
      }, FALLBACK_TIMEOUT);
    }

    return () => {
      window.removeEventListener('load', handleWindowLoad);
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    };
  }, [stage, startRevealSequence]);


  const handleRevealPaneAnimationEnd = () => {
    if (stage === 'covering') {
      setStage('uncovering');
    } else if (stage === 'uncovering') {
      // After uncover animation, start fading out the main overlay
      setStage('fadingOutOverlay');
      setMainOverlayOpacity(0);
      setTimeout(() => {
        setStage('hidden');
      }, FADE_DURATION); // Match CSS transition duration
    }
  };

  if (stage === 'hidden') {
    return null;
  }

  return (
    <>
      {/* Main dark overlay - present during counting, gets faded at the end */}
      {(stage === 'counting' || stage === 'covering' || stage === 'uncovering' || stage === 'fadingOutOverlay') && (
        <div
          id="preloader-main-overlay"
          style={{ opacity: mainOverlayOpacity, transition: `opacity ${FADE_DURATION}ms ease-in-out` }}
          className="fixed inset-0 z-[9998] flex items-end justify-end p-4 bg-black text-white"
          aria-hidden={stage === 'hidden'}
          role="status"
        >
          {stage === 'counting' && (
            <div className="absolute bottom-4 right-4 p-2 bg-black/50 rounded">
              <span className="text-5xl font-bold text-white">
                {progress}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Reveal Pane - this is what animates to cover and then uncover */}
      {(stage === 'covering' || stage === 'uncovering') && (
        <div
          ref={revealPaneRef}
          id="reveal-pane"
          onAnimationEnd={handleRevealPaneAnimationEnd}
          className={cn(
            "fixed inset-x-0 bg-black z-[9999]", // Higher z-index than main overlay
            {
              'animate-cover-screen bottom-0': stage === 'covering',
              'animate-uncover-screen top-0 h-full': stage === 'uncovering', // Start full height, anchored top
            }
          )}
        />
      )}
    </>
  );
}
