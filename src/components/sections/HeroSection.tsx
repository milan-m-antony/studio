// src/components/sections/HeroSection.tsx
"use client";

import { useEffect, useState, type ReactNode } from 'react';
import { ChevronDown, Link as GenericLinkIcon } from 'lucide-react';
import NextLink from 'next/link';
import NextImage from 'next/image';
import type { HeroContent, HeroSocialLinkItem } from '@/types/supabase';
import { cn } from '@/lib/utils';

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
        setDisplayedText("— a Developer"); 
        return;
    }
    setCharDisplayProgress(0);
    setDisplayedText(''); 
    setIsDeleting(false);
  }, [texts, currentTextIndex]);


  useEffect(() => {
    if (!texts || texts.length === 0) return;

    const currentTargetText = texts[currentTextIndex];
    let timer: NodeJS.Timeout;

    if (!isDeleting) { 
      if (charDisplayProgress < currentTargetText.length) {
        timer = setTimeout(() => {
          setDisplayedText(currentTargetText.substring(0, charDisplayProgress + 1));
          setCharDisplayProgress((prev) => prev + 1);
        }, typingSpeed);
      } else { 
        timer = setTimeout(() => {
          setIsDeleting(true); 
        }, pauseAfterTypingDuration);
      }
    } else { 
      if (charDisplayProgress > 0) {
        timer = setTimeout(() => {
          setDisplayedText(currentTargetText.substring(0, charDisplayProgress - 1));
          setCharDisplayProgress((prev) => prev - 1);
        }, deletingSpeed);
      } else { 
        timer = setTimeout(() => {
          setIsDeleting(false); 
          setCurrentTextIndex((prev) => (prev + 1) % texts.length); 
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

  return <span>{displayedText || <>&nbsp;</>}</span>; 
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
    // console.log('[HeroSection] Received heroContent:', JSON.stringify(heroContent, null, 2));
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [heroContent]);

  const mainName = heroContent?.main_name || "Your Name";
  const subtitles = (heroContent?.subtitles && heroContent.subtitles.length > 0)
    ? heroContent.subtitles
    : ["— a Creative Developer", "— a Full-Stack Engineer", "— a Tech Enthusiast"];

  const socialLinksToRender: HeroSocialLinkItem[] =
    heroContent?.social_media_links && Array.isArray(heroContent.social_media_links)
    ? heroContent.social_media_links.map((link, index): HeroSocialLinkItem => ({
        id: link.id || `client-social-${index}`, 
        label: link.label,
        url: link.url,
        iconImageUrl: link.icon_image_url || null,
      }))
    : []; 

  // console.log('[HeroSection] socialLinksToRender for public page:', JSON.stringify(socialLinksToRender.map(l => ({label: l.label, url: l.url, iconImageUrl: l.iconImageUrl ? 'Image Provided' : 'No Image'}))));


  return (
    <section id="hero" className="relative h-screen flex flex-col items-center justify-center overflow-hidden text-center bg-background text-foreground p-4">
      <div className="absolute inset-0 z-0" style={{ transform: `translateY(${offsetY * 0.5}px)` }}>
      </div>

      {socialLinksToRender.length > 0 && (
        <div
          className="absolute left-3 sm:left-4 md:left-6 lg:left-8 top-1/2 -translate-y-1/2 z-20 flex flex-col space-y-4 sm:space-y-5 md:space-y-6"
          style={{ transform: `translateY(-50%) translateY(${offsetY * 0.1}px)` }}
        >
          {socialLinksToRender.map((social, index) => {
             // More detailed log for debugging
             console.log(`[HeroSection] Rendering social link: Label="${social.label}", URL="${social.url}", IconImageURL="${social.iconImageUrl}"`);
            return (
              <NextLink key={social.id || `social-link-${index}`} href={social.url || '#'} target="_blank" rel="noopener noreferrer" aria-label={social.label || 'Social link'}>
                {social.iconImageUrl && typeof social.iconImageUrl === 'string' && social.iconImageUrl.trim() !== '' ? (
                  <div className="relative h-5 w-5 sm:h-6 sm:w-6 transition-transform duration-300 ease-in-out transform hover:scale-125">
                    <NextImage
                      src={social.iconImageUrl} 
                      alt={social.label || 'Social icon'}
                      width={24} 
                      height={24} 
                      className="object-contain" // Ensure this doesn't have dark mode filters
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
        <NextLink href="#about" aria-label="Scroll to about section">
          <ChevronDown className="h-10 w-10 text-foreground/70 animate-bounce hover:text-primary transition-colors" />
        </NextLink>
      </div>
    </section>
  );
}
