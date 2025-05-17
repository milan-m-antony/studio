
"use client";

import { useEffect, useState, type ComponentType } from 'react';
import { ChevronDown, type LucideProps } from 'lucide-react';
import Link from 'next/link';
import type { HeroContent, HeroSocialLinkItem } from '@/types/supabase';
import * as LucideIcons from 'lucide-react'; // Import all Lucide icons

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

const getLucideIcon = (iconName: string): ComponentType<LucideProps> => {
  const IconComponent = LucideIcons[iconName as keyof typeof LucideIcons] as ComponentType<LucideProps> | undefined;
  if (IconComponent && typeof IconComponent === 'function') {
    return IconComponent;
  }
  console.warn(`HeroSection: Lucide icon "${iconName}" not found or invalid. Falling back to Link icon.`);
  return LucideIcons.Link2; // Default fallback icon
};


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
    : ["— a Creative Developer", "— a Full-Stack Engineer", "— a Tech Enthusiast"];

  const socialLinksToRender: Array<{ href: string; icon: ComponentType<LucideProps>; label: string }> = 
    heroContent?.social_media_links?.map(link => ({
      href: link.url,
      icon: getLucideIcon(link.icon_name),
      label: link.label
    })) || [
      // Default fallback links if none are provided from DB
      { href: "https://github.com", icon: LucideIcons.Github, label: "GitHub" },
      { href: "https://linkedin.com", icon: LucideIcons.Linkedin, label: "LinkedIn" },
    ];

  return (
    <section id="hero" className="relative h-screen flex flex-col items-center justify-center overflow-hidden text-center bg-background text-foreground p-4">
      <div className="absolute inset-0 z-0" style={{ transform: `translateY(${offsetY * 0.5}px)` }}>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10 opacity-50" />
      </div>
      
      {socialLinksToRender.length > 0 && (
        <div 
          className="absolute left-4 md:left-6 lg:left-8 top-1/2 -translate-y-1/2 z-20 flex flex-col space-y-6" // Increased space-y-4 to space-y-6
          style={{ transform: `translateY(-50%) translateY(${offsetY * 0.1}px)` }}
        >
          {socialLinksToRender.map((social) => (
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
        <p className="text-2xl sm:text-3xl md:text-4xl font-light mb-12 text-foreground/90 min-h-[2.5em] sm:min-h-[1.5em] animate-fadeIn" style={{animationDelay: '0.8s'}}>
          <EnhancedTypewriter 
            texts={subtitles} 
          />
        </p>
      </div>
      
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

    