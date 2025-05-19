// src/components/layout/Preloader.tsx
"use client";

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function Preloader() {
  const [loading, setLoading] = useState(true);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    const handleLoad = () => {
      // Start fade out
      setFadingOut(true);
      // After fade out duration, remove from DOM
      setTimeout(() => {
        setLoading(false);
      }, 500); // This duration should match your CSS transition duration
    };

    // Fallback timeout in case window.onload is very slow or doesn't fire reliably
    const fallbackTimeoutId = setTimeout(() => {
      console.warn("Preloader: Fallback timeout triggered to hide preloader.");
      handleLoad();
    }, 7000); // Hide after 7 seconds regardless

    if (document.readyState === 'complete') {
      clearTimeout(fallbackTimeoutId); // Clear fallback if already loaded
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
    }

    return () => {
      window.removeEventListener('load', handleLoad);
      clearTimeout(fallbackTimeoutId);
    };
  }, []);

  if (!loading) {
    return null; // Remove preloader from DOM when loading is complete
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
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      {/* Optional: You can add a logo or loading text here */}
      {/* <p className="mt-4 text-lg text-primary">Loading Portfolio...</p> */}
    </div>
  );
}
