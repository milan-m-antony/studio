
"use client";

import { useEffect, useState } from 'react';
import { Github, Linkedin, Instagram, Facebook, ChevronDown } from 'lucide-react';
import Link from 'next/link';

// Enhanced Typewriter component specific to HeroSection
const EnhancedTypewriter = ({
  texts,
  typingSpeed = 60,
  deletingSpeed = 40,
  pauseAfterTypingDuration = 1500,
  pauseAfterDeletingDuration = 500,
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
  // charDisplayProgress tracks the number of characters currently displayed from the target string
  const [charDisplayProgress, setCharDisplayProgress] = useState(0);

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
          // charDisplayProgress is already at currentTargetText.length, which is correct for starting deletion
        }, pauseAfterTypingDuration);
      }
    } else { // Deleting phase
      if (charDisplayProgress > 0) {
        timer = setTimeout(() => {
          // Use currentTargetText to ensure correct substring during deletion
          setDisplayedText(currentTargetText.substring(0, charDisplayProgress - 1));
          setCharDisplayProgress((prev) => prev - 1);
        }, deletingSpeed);
      } else { // Finished deleting, pause then switch to next text
        timer = setTimeout(() => {
          setIsDeleting(false);
          setCurrentTextIndex((prev) => (prev + 1) % texts.length);
          // charDisplayProgress is 0, ready for next typing. displayedText is already ""
        }, pauseAfterDeletingDuration);
      }
    }

    return () => clearTimeout(timer);
  }, [
    charDisplayProgress,
    isDeleting,
    currentTextIndex,
    texts,
    typingSpeed,
    deletingSpeed,
    pauseAfterTypingDuration,
    pauseAfterDeletingDuration,
  ]);

  // Effect to reset progress when the text to display (currentTextIndex) changes,
  // ensuring we start typing the new text from scratch.
  useEffect(() => {
    // Only reset if we are not in a deleting phase.
    // This check ensures that if currentTextIndex changes as part of finishing deletion,
    // we correctly reset for the *next* typing cycle.
    if (!isDeleting) {
      setCharDisplayProgress(0);
      setDisplayedText('');
    }
  }, [currentTextIndex, isDeleting]); // isDeleting is included to correctly handle the transition from deleting to typing the next word


  return <span>{displayedText}</span>;
};


export default function HeroSection() {
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

  const socialLinks = [
    { href: "https://github.com/yourusername", icon: Github, label: "GitHub" },
    { href: "https://linkedin.com/in/yourusername", icon: Linkedin, label: "LinkedIn" },
    { href: "https://instagram.com/yourusername", icon: Instagram, label: "Instagram" },
    { href: "https://facebook.com/yourusername", icon: Facebook, label: "Facebook" },
  ];

  const roles = [
    "— a Creative Developer",
    "— a Cloud Developer",
    "— a Web Designer",
    "— a Network Engineer",
    "— a Full-Stack Specialist",
  ];

  return (
    <section id="hero" className="relative h-screen flex flex-col items-center justify-center overflow-hidden text-center bg-background text-foreground p-4">
      {/* Parallax Background Layers */}
      <div className="absolute inset-0 z-0" style={{ transform: `translateY(${offsetY * 0.5}px)` }}>
        {/* Layer 1 - Farthest */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10 opacity-50" />
      </div>
      <div className="absolute inset-0 z-0" style={{ transform: `translateY(${offsetY * 0.3}px)` }}>
        {/* Layer 2 - Middle (Subtle patterns or shapes) */}
      </div>
      
      {/* Social Media Icons */}
      <div className="absolute left-4 md:left-6 lg:left-8 top-1/2 -translate-y-1/2 z-20 flex flex-col space-y-6" style={{ transform: `translateY(-50%) translateY(${offsetY * 0.1}px)` }}>
        {socialLinks.map((social) => (
          <Link key={social.label} href={social.href} target="_blank" rel="noopener noreferrer" aria-label={social.label}>
            <social.icon className="h-6 w-6 text-foreground/70 hover:text-primary transition-colors duration-300 ease-in-out transform hover:scale-110" />
          </Link>
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center" style={{ transform: `translateY(${offsetY * 0.15}px)` }}>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 mt-8 animate-fadeIn" style={{animationDelay: '0.5s'}}>
          Hi, I'm Milan
        </h1>
        <p className="text-2xl sm:text-3xl md:text-4xl font-light mb-8 text-foreground/90 min-h-[2.5em] sm:min-h-[1.5em] animate-fadeIn" style={{animationDelay: '0.8s'}}>
          <EnhancedTypewriter 
            texts={roles} 
            typingSpeed={60} 
            deletingSpeed={40}
            pauseAfterTypingDuration={1800}
            pauseAfterDeletingDuration={300}
          />
        </p>
      </div>
      
      {/* Scroll Down Arrow */}
      <div 
        className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 animate-fadeIn" 
        style={{ animationDelay: '1.5s', transform: `translateX(-50%) translateY(${offsetY * 0.05}px)` }}
      >
        <a href="#about" aria-label="Scroll to about section">
          <ChevronDown className="h-10 w-10 text-foreground/70 animate-bounce hover:text-primary transition-colors" />
        </a>
      </div>
    </section>
  );
}

