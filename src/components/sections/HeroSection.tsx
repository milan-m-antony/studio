
"use client";

import { useEffect, useState, type ComponentType } from 'react';
import { ChevronDown, Link as GenericLinkIcon } from 'lucide-react'; // Link renamed to GenericLinkIcon
import NextLink from 'next/link'; // Renamed to avoid conflict with our Link component
import Image from 'next/image'; // For displaying social icons if URLs are provided
import type { HeroContent, HeroSocialLinkItem } from '@/types/supabase';
// LucideIcons import is removed as we will use image URLs for icons

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
    // Reset when texts or currentTextIndex changes
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

  return <span>{displayedText || <>&nbsp;</>}</span>; // Render a space if empty to maintain height
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
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const mainName = heroContent?.main_name || "Your Name"; 
  const subtitles = (heroContent?.subtitles && heroContent.subtitles.length > 0)
    ? heroContent.subtitles 
    : ["— a Creative Developer", "— a Full-Stack Engineer", "— a Tech Enthusiast"]; // Default subtitles

  // Use HeroSocialLinkItem which expects icon_image_url
  const socialLinksToRender: Array<{ href: string; iconImageUrl: string | null; label: string }> = 
    heroContent?.social_media_links?.map(link => ({
      href: link.url,
      iconImageUrl: link.icon_image_url || null, // Use image URL
      label: link.label
    })) || [
      // Default fallback links if none are provided from DB
      { href: "https://github.com", iconImageUrl: null, label: "GitHub" }, // No default image, will use GenericLinkIcon
      { href: "https://linkedin.com", iconImageUrl: null, label: "LinkedIn" },
    ];
  console.log('[HeroSection] Rendering with socialLinksToRender:', socialLinksToRender);


  return (
    <section id="hero" className="relative h-screen flex flex-col items-center justify-center overflow-hidden text-center bg-background text-foreground p-4">
      {/* Parallax Background Elements */}
      <div className="absolute inset-0 z-0" style={{ transform: `translateY(${offsetY * 0.5}px)` }}>
        {/* Example subtle animated background - can be replaced with Vanta.js or similar if desired */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10 opacity-50" />
      </div>
      
      {/* Social Media Icons - Vertical on Left */}
      {socialLinksToRender.length > 0 && (
        <div 
          className="absolute left-4 md:left-6 lg:left-8 top-1/2 -translate-y-1/2 z-20 flex flex-col space-y-6"
          style={{ transform: `translateY(-50%) translateY(${offsetY * 0.1}px)` }}
        >
          {socialLinksToRender.map((social) => (
            <NextLink key={social.label} href={social.href} target="_blank" rel="noopener noreferrer" aria-label={social.label}>
              {social.iconImageUrl ? (
                <div className="relative h-6 w-6 transition-transform duration-300 ease-in-out transform hover:scale-125">
                  <Image 
                    src={social.iconImageUrl} 
                    alt={social.label} 
                    fill 
                    className="object-contain dark:filter dark:brightness-0 dark:invert" // Invert in dark mode for visibility
                  />
                </div>
              ) : (
                <GenericLinkIcon className="h-6 w-6 text-foreground/70 hover:text-primary transition-colors duration-300 ease-in-out transform hover:scale-110" />
              )}
            </NextLink>
          ))}
        </div>
      )}

      {/* Main Hero Content */}
      <div className="relative z-10 flex flex-col items-center" style={{ transform: `translateY(${offsetY * 0.15}px)` }}>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 mt-8 animate-fadeIn" style={{animationDelay: '0.5s'}}>
          Hi, I'm {mainName}
        </h1>
        <p className="text-2xl sm:text-3xl md:text-4xl font-light mb-12 text-foreground/90 min-h-[2.5em] sm:min-h-[1.5em] animate-fadeIn" style={{animationDelay: '0.8s'}}>
          <EnhancedTypewriter 
            texts={subtitles} 
          />
        </p>
      </div>
      
      {/* Scroll Down Arrow */}
      <div 
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 animate-fadeIn" 
        style={{ animationDelay: '1.5s', transform: `translateX(-50%) translateY(${offsetY * 0.05}px)` }}
      >
        <a href="#about" aria-label="Scroll to about section">
          <ChevronDown className="h-10 w-10 text-foreground/70 animate-bounce hover:text-primary transition-colors" />
        </a>
      </div>
    </section>
  );
}
