// src/components/sections/HeroSection.tsx
"use client";

import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { ChevronDown, Link as GenericLinkIcon } from 'lucide-react';
import NextLink from 'next/link';
import Image from 'next/image';
import type { HeroContent, HeroSocialLinkItem } from '@/types/supabase';
import { cn } from '@/lib/utils'; // Ensure cn is imported

const EnhancedTypewriter = ({
  texts,
  typingSpeed = 60,
  deletingSpeed = 40,
  pauseAfterTypingDuration = 1800,
  pauseAfterDeletingDuration = 300,
}: {
  texts: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseAfterTypingDuration?: number;
  pauseAfterDeletingDuration?: number;
}) => {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [charDisplayProgress, setCharDisplayProgress] = useState(0);

  useEffect(() => {
    if (!texts || texts.length === 0) {
        setDisplayedText("— a Developer"); // Default if no texts provided
        return;
    }
    // Reset when texts or currentTextIndex (for looping) changes
    setCharDisplayProgress(0);
    setDisplayedText('');
    setIsDeleting(false);
  }, [texts, currentTextIndex]);


  useEffect(() => {
    if (!texts || texts.length === 0) return;

    const currentTargetText = texts[currentTextIndex];
    let timer: NodeJS.Timeout;

    if (!isDeleting) { // Typing mode
      if (charDisplayProgress < currentTargetText.length) {
        timer = setTimeout(() => {
          setDisplayedText(currentTargetText.substring(0, charDisplayProgress + 1));
          setCharDisplayProgress((prev) => prev + 1);
        }, typingSpeed);
      } else { // Finished typing current text
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, pauseAfterTypingDuration);
      }
    } else { // Deleting mode
      if (charDisplayProgress > 0) {
        timer = setTimeout(() => {
          setDisplayedText(currentTargetText.substring(0, charDisplayProgress - 1));
          setCharDisplayProgress((prev) => prev - 1);
        }, deletingSpeed);
      } else { // Finished deleting current text
        timer = setTimeout(() => {
          setIsDeleting(false);
          setCurrentTextIndex((prev) => (prev + 1) % texts.length); // Move to next text
        }, pauseAfterDeletingDuration);
      }
    }
    return () => clearTimeout(timer);
  }, [
    charDisplayProgress,
    isDeleting,
    texts,
    currentTextIndex,
    typingSpeed,
    deletingSpeed,
    pauseAfterTypingDuration,
    pauseAfterDeletingDuration,
  ]);

  return <span>{displayedText || <>&nbsp;</>}</span>; // Render a non-breaking space if empty to maintain height
};

interface HeroSectionProps {
  heroContent: HeroContent | null;
}

export default function HeroSection({ heroContent }: HeroSectionProps) {
  const [offsetY, setOffsetY] = useState(0);

  const handleScroll = () => {
    if (typeof window !== 'undefined') {
      setOffsetY(window.pageYOffset);
    }
  };

  useEffect(() => {
    // console.log('[HeroSection] Received heroContent prop:', JSON.stringify(heroContent, null, 2));
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const mainName = heroContent?.main_name || "Your Name";
  const subtitles = (heroContent?.subtitles && heroContent.subtitles.length > 0)
    ? heroContent.subtitles
    : ["— a Creative Developer", "— a Full-Stack Engineer", "— a Tech Enthusiast"];

  const socialLinksToRender: Array<{ href: string; iconImageUrl: string | null; label: string; }> =
    heroContent?.social_media_links && Array.isArray(heroContent.social_media_links)
    ? heroContent.social_media_links.map((link, index) => {
        // console.log(`[HeroSection] Processing link ${index} from prop: label="${link.label}", url="${link.url}", icon_image_url="${link.icon_image_url}"`);
        return {
          href: link.url,
          iconImageUrl: link.icon_image_url || null,
          label: link.label,
        };
      })
    : [ // Default links if nothing is fetched
        { href: "https://github.com", iconImageUrl: null, label: "GitHub (Default)"},
        { href: "https://linkedin.com", iconImageUrl: null, label: "LinkedIn (Default)"},
      ];

  // console.log('[HeroSection] socialLinksToRender:', JSON.stringify(socialLinksToRender.map(l => ({label: l.label, url: l.href, icon: l.iconImageUrl ? 'image' : 'component'}))));

  return (
    <section id="hero" className="relative h-screen flex flex-col items-center justify-center overflow-hidden text-center bg-background text-foreground p-4">
      <div className="absolute inset-0 z-0" style={{ transform: `translateY(${offsetY * 0.5}px)` }}>
        {/* Optional: Add subtle background elements if needed */}
        {/* <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5 opacity-50" /> */}
      </div>

      {socialLinksToRender.length > 0 && (
        <div
          className="absolute left-3 sm:left-4 md:left-6 lg:left-8 top-1/2 -translate-y-1/2 z-20 flex flex-col space-y-4 sm:space-y-5 md:space-y-6"
          style={{ transform: `translateY(-50%) translateY(${offsetY * 0.1}px)` }}
        >
          {socialLinksToRender.map((social, index) => {
            // console.log(`[HeroSection] Rendering social link: ${social.label}, Icon URL: ${social.iconImageUrl}`);
            return (
              <NextLink key={social.label || `social-${index}`} href={social.href || '#'} target="_blank" rel="noopener noreferrer" aria-label={social.label}>
                {social.iconImageUrl ? (
                  <div className="relative h-5 w-5 sm:h-6 sm:w-6 transition-transform duration-300 ease-in-out transform hover:scale-125">
                    <Image
                      src={social.iconImageUrl}
                      alt={social.label || 'Social icon'}
                      fill
                      className="object-contain" // Removed dark mode invert filter
                    />
                  </div>
                ) : (
                  <GenericLinkIcon className="h-5 w-5 sm:h-6 sm:w-6 text-foreground/70 hover:text-primary transition-colors duration-300 ease-in-out transform hover:scale-110" />
                )}
              </NextLink>
            );
          })}
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center" style={{ transform: `translateY(${offsetY * 0.15}px)` }}>
        <h1 className={cn(
            "text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4 animate-fadeIn"
          )}
          style={{animationDelay: '0.5s'}}
        >
          Hi, I'm {mainName}
        </h1>
        <p className={cn(
            "text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-light mb-12 sm:mb-10 md:mb-12 text-foreground/90 min-h-[3em] sm:min-h-[2.5em] md:min-h-[2em] animate-fadeIn"
          )}
          style={{animationDelay: '0.8s'}}
        >
          <EnhancedTypewriter
            texts={subtitles}
          />
        </p>
      </div>

      <div
        className="absolute bottom-10 sm:bottom-8 md:bottom-10 left-1/2 -translate-x-1/2 z-20 animate-fadeIn"
        style={{ animationDelay: '1.5s', transform: `translateX(-50%) translateY(${offsetY * 0.05}px)` }}
      >
        <a href="#about" aria-label="Scroll to about section">
          <ChevronDown className="h-8 w-8 sm:h-10 sm:w-10 text-foreground/70 animate-bounce hover:text-primary transition-colors" />
        </a>
      </div>
    </section>
  );
}

