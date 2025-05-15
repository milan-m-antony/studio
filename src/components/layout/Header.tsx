"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X, Sun, Moon, Code2, Home, User, Briefcase, Wrench, Map as MapIcon, Award, FileText, Mail, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useTheme } from '@/contexts/ThemeProvider';
import { cn } from '@/lib/utils';

// Base public navigation items
const publicNavItems = [
  { href: '#hero', label: 'Home', icon: Home },
  { href: '#about', label: 'About', icon: User },
  { href: '#projects', label: 'Projects', icon: Briefcase },
  { href: '#skills', label: 'Skills', icon: Wrench },
  { href: '#timeline', label: 'Journey', icon: MapIcon },
  { href: '#certifications', label: 'Certifications', icon: Award },
  { href: '#resume', label: 'Resume', icon: FileText },
  { href: '#contact', label: 'Contact', icon: Mail },
];

// Admin dashboard navigation item
const adminDashboardNavItem = { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard };

const NavLinks = ({ onClick, activeHref, navItemsToRender }: { onClick?: () => void; activeHref: string; navItemsToRender: Array<typeof publicNavItems[0] | typeof adminDashboardNavItem> }) => (
  <>
    {navItemsToRender.map((item) => {
      const IconComponent = item.icon;
      const isActive = item.href === activeHref;
      return (
        <Link
          key={item.label}
          href={item.href}
          onClick={() => {
            if (onClick) onClick();
          }}
          className={cn(
            "relative text-sm font-medium text-foreground/80 px-3 py-2 rounded-md flex items-center transition-colors duration-150 ease-in-out",
            isActive ? "text-primary font-semibold" : "group overflow-hidden hover:text-primary"
          )}
          aria-current={isActive ? "page" : undefined}
        >
          {isActive ? (
            <>
              <IconComponent className="h-5 w-5 mr-2 text-primary" />
              <span>{item.label}</span>
            </>
          ) : (
            <>
              <span className="inline-block transition-all duration-300 ease-in-out group-hover:translate-x-full group-hover:opacity-0">
                {item.label}
              </span>
              <IconComponent
                className="absolute left-3 top-1/2 transform -translate-y-1/2
                           inline-block transition-all duration-300 ease-in-out
                           translate-x-[-120%] group-hover:translate-x-0
                           text-primary opacity-0 group-hover:opacity-100 h-5 w-5"
              />
            </>
          )}
        </Link>
      );
    })}
  </>
);

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const [activeLink, setActiveLink] = useState<string>('#hero');
  const pathname = usePathname();
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [currentNavItems, setCurrentNavItems] = useState(publicNavItems);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const updateAdminStatusAndNavItems = () => {
      if (typeof window !== 'undefined') {
        const authenticated = localStorage.getItem('isAdminAuthenticated') === 'true';
        setIsUserAdmin(authenticated);
        setCurrentNavItems(authenticated ? [...publicNavItems, adminDashboardNavItem] : publicNavItems);
      }
    };

    updateAdminStatusAndNavItems(); // Initial check on mount

    const handleAuthChange = () => {
      updateAdminStatusAndNavItems();
    };

    window.addEventListener('authChange', handleAuthChange);
    // Listen to storage events for changes in other tabs/windows
    window.addEventListener('storage', (event) => {
        if (event.key === 'isAdminAuthenticated') {
            updateAdminStatusAndNavItems();
        }
    });


    return () => {
      window.removeEventListener('authChange', handleAuthChange);
      window.removeEventListener('storage', (event) => {
         if (event.key === 'isAdminAuthenticated') {
            updateAdminStatusAndNavItems();
        }
      });
    };
  }, []); // Empty dependency array: runs once on mount for setup, cleanup on unmount

  useEffect(() => {
    const determineActiveLink = () => {
      const currentPath = pathname;
      const currentHash = window.location.hash;

      // Handle admin dashboard link explicitly
      if (currentPath === '/admin/dashboard' && currentNavItems.some(item => item.href === '/admin/dashboard')) {
        setActiveLink('/admin/dashboard');
        return;
      }
      // If on any other /admin page, and dashboard link is not the target, no public nav should be active
      if (currentPath.startsWith('/admin') && currentPath !== '/admin/dashboard') {
        setActiveLink('');
        return;
      }
      
      // Logic for public pages (scroll spy)
      if (currentPath === '/') {
        if (currentHash && currentHash !== '#') {
          if (currentNavItems.some(item => item.href === currentHash)) {
            setActiveLink(currentHash);
            return;
          }
        }

        let newActiveLink = '#hero'; // Default for top of page
        let minDistance = Infinity;
        const referencePoint = 150; // Pixels from top of viewport to consider an item "active"

        for (const item of currentNavItems) {
          if (item.href.startsWith('/')) continue; // Skip page links like /admin/dashboard

          const element = document.getElementById(item.href.substring(1));
          if (element) {
            const rect = element.getBoundingClientRect();
            const elementTop = rect.top;
            const elementBottom = rect.bottom;
            const viewportHeight = window.innerHeight;
            const isInView = elementTop < viewportHeight && elementBottom > 0;

            if (isInView) {
                const distance = Math.abs(elementTop - referencePoint);
                if (distance < minDistance) {
                    minDistance = distance;
                    newActiveLink = item.href;
                }
            }
          }
        }
        // Check if user has scrolled to the bottom of the page
        if ((window.innerHeight + Math.ceil(window.scrollY)) >= document.body.offsetHeight - 50) {
            const contactItem = currentNavItems.find(item => item.href === '#contact');
            if (contactItem) newActiveLink = contactItem.href;
        }
        // Check if user is at the top of the page
        else if (window.scrollY <= 50) {
            const heroItem = currentNavItems.find(item => item.href === '#hero');
            if (heroItem) newActiveLink = heroItem.href;
        }
        setActiveLink(newActiveLink);
      }
    };

    if (mounted) {
      determineActiveLink(); // Initial call
      window.addEventListener('scroll', determineActiveLink, { passive: true });
      window.addEventListener('hashchange', determineActiveLink);
      window.addEventListener('resize', determineActiveLink); // Recalculate on resize
    }

    return () => {
      if (mounted) {
        window.removeEventListener('scroll', determineActiveLink);
        window.removeEventListener('hashchange', determineActiveLink);
        window.removeEventListener('resize', determineActiveLink);
      }
    };
  }, [pathname, mounted, currentNavItems]); // Re-run if currentNavItems changes (e.g., admin logs in/out)


  if (!mounted) return null;

  let effectiveTheme = theme;
  if (theme === 'system' && typeof window !== 'undefined') {
    effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  const toggleTheme = () => {
    if (effectiveTheme === 'dark') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Code2 className="h-7 w-7 text-primary" />
          <span className="font-bold text-xl">Milan.dev</span>
        </Link>

        <nav className="hidden md:flex items-center space-x-1">
          <NavLinks activeHref={activeLink} navItemsToRender={currentNavItems} />
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            {effectiveTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu" className="transition-transform duration-300 ease-in-out hover:rotate-90">
                  {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[300px] sm:w-[340px] p-0 transition-transform duration-500 ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-right-full"
              >
                <SheetHeader className="p-6 border-b text-left">
                  <SheetTitle>
                    <Link
                      href="/"
                      className="flex items-center gap-2"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Code2 className="h-7 w-7 text-primary" />
                      <span className="font-bold text-xl">Milan.dev</span>
                    </Link>
                  </SheetTitle>
                </SheetHeader>
                <div className="p-6">
                  <nav className="flex flex-col space-y-3">
                    <NavLinks onClick={() => setIsMobileMenuOpen(false)} activeHref={activeLink} navItemsToRender={currentNavItems} />
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
