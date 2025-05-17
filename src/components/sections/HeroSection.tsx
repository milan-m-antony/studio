
"use client";

import { useEffect, useState, type ComponentType } from 'react';
import { Github, Linkedin, Instagram, Facebook, ChevronDown, type LucideProps } from 'lucide-react';
import Link from 'next/link';
import type { HeroContent } from '@/types/supabase'; // Import the HeroContent type

// Enhanced Typewriter component
const EnhancedTypewriter = ({
  texts,
  typingSpeed = 60,
  deletingSpeed = 40,
  pauseAfterTypingDuration = 1800, // Increased pause
  pauseAfterDeletingDuration = 300,  // Shorter pause before next
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
        setDisplayedText("— a Developer"); // Fallback if no texts provided
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

    if (!isDeleting) { // Typing phase
      if (charDisplayProgress < currentTargetText.length) {
        timer = setTimeout(() => {
          setDisplayedText(currentTargetText.substring(0, charDisplayProgress + 1));
          setCharDisplayProgress((prev) => prev + 1);
        }, typingSpeed);
      } else { // Finished typing, pause then switch to deleting
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, pauseAfterTypingDuration);
      }
    } else { // Deleting phase
      if (charDisplayProgress > 0) {
        timer = setTimeout(() => {
          setDisplayedText(currentTargetText.substring(0, charDisplayProgress - 1));
          setCharDisplayProgress((prev) => prev - 1);
        }, deletingSpeed);
      } else { // Finished deleting, pause then switch to next text
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

  return <span>{displayedText || <>&nbsp;</>}</span>; // Ensure it's never empty to avoid layout shift
};

interface SocialLinkItem {
  href: string;
  icon: ComponentType<LucideProps>;
  label: string;
}

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

  // Use heroContent prop with fallbacks
  const mainName = heroContent?.main_name || "Your Name"; 
  const subtitles = (heroContent?.subtitles && heroContent.subtitles.length > 0)
    ? heroContent.subtitles 
    : ["— a Creative Developer", "— a Full-Stack Engineer", "— a Tech Enthusiast"];

  const socialLinks: SocialLinkItem[] = [];
  if (heroContent?.social_github_url) {
    socialLinks.push({ href: heroContent.social_github_url, icon: Github, label: "GitHub" });
  }
  if (heroContent?.social_linkedin_url) {
    socialLinks.push({ href: heroContent.social_linkedin_url, icon: Linkedin, label: "LinkedIn" });
  }
  if (heroContent?.social_instagram_url) {
    socialLinks.push({ href: heroContent.social_instagram_url, icon: Instagram, label: "Instagram" });
  }
  if (heroContent?.social_facebook_url) {
    socialLinks.push({ href: heroContent.social_facebook_url, icon: Facebook, label: "Facebook" });
  }

  return (
    <section id="hero" className="relative h-screen flex flex-col items-center justify-center overflow-hidden text-center bg-background text-foreground p-4">
      {/* Parallax Background Layers */}
      <div className="absolute inset-0 z-0" style={{ transform: `translateY(${offsetY * 0.5}px)` }}>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10 opacity-50" />
      </div>
      
      {socialLinks.length > 0 && (
        <div 
          className="absolute left-4 md:left-6 lg:left-8 top-1/2 -translate-y-1/2 z-20 flex flex-col space-y-6" 
          style={{ transform: `translateY(-50%) translateY(${offsetY * 0.1}px)` }}
        >
          {socialLinks.map((social) => (
            <Link key={social.label} href={social.href} target="_blank" rel="noopener noreferrer" aria-label={social.label}>
              <social.icon className="h-6 w-6 text-foreground/70 hover:text-primary transition-colors duration-300 ease-in-out transform hover:scale-110" />
            </Link>
          ))}
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center" style={{ transform: `translateY(${offsetY * 0.15}px)` }}>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 mt-8 animate-fadeIn" style={{animationDelay: '0.5s'}}>
          Hi, I'm {mainName}
        </h1>
        <p className="text-2xl sm:text-3xl md:text-4xl font-light mb-8 text-foreground/90 min-h-[2.5em] sm:min-h-[1.5em] animate-fadeIn" style={{animationDelay: '0.8s'}}>
          <EnhancedTypewriter 
            texts={subtitles} 
            typingSpeed={60} 
            deletingSpeed={40}
            pauseAfterTypingDuration={1800}
            pauseAfterDeletingDuration={300}
          />
        </p>
      </div>
      
      <div 
        className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 animate-fadeIn" 
        style={{ animationDelay: '1.5s', transform: `translateX(-50%) translateY(${offsetY * 0.05}px)` }}
      >
        <a href="#about" aria-label="Scroll to about section">
          <ChevronDown className="h-10 w-10 text-foreground/70 animate-bounce hover:text-primary transition-colors" />
        </a>
      </div>
    </section>
  );
}
