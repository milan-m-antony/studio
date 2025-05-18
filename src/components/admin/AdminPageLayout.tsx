
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Home, Users, Briefcase, Wrench, MapPin as JourneyIcon, Award, FileText as ResumeIcon, Mail, Settings, Menu, X, Sun, Moon, LogOut as LogoutIcon, LayoutDashboard } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeProvider';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation'; 
import React, { useState, useEffect } from 'react';

export interface AdminNavItem {
  key: string;
  label: string;
  icon: LucideIcon;
  href?: string; 
}

interface AdminPageLayoutProps {
  navItems: AdminNavItem[];
  activeSection: string;
  onSelectSection: (sectionKey: string) => void;
  onLogout: () => void;
  username: string;
  children: React.ReactNode;
  pageTitle: string;
}

export default function AdminPageLayout({
  navItems,
  activeSection,
  onSelectSection,
  onLogout,
  username,
  children,
  pageTitle
}: AdminPageLayoutProps) {
  const { theme, setTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null; 

  let effectiveTheme = theme;
  if (theme === 'system' && typeof window !== 'undefined') {
    effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  const toggleTheme = () => setTheme(effectiveTheme === 'dark' ? 'light' : 'dark');


  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className={cn("flex flex-col h-full", isMobile ? "w-full" : "w-64")}>
      <div className="p-4 border-b border-border">
        <Link href="/admin/dashboard" className="flex items-center gap-2" onClick={() => { onSelectSection('dashboard'); if(isMobile) setIsMobileMenuOpen(false);}}>
          <LayoutDashboard className="h-7 w-7 text-primary" />
          <span className="font-bold text-xl text-foreground">Admin</span>
        </Link>
      </div>
      <nav className="flex-grow p-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.key;
          return (
            <Button
              key={item.key}
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start text-sm",
                isActive ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              onClick={() => {
                onSelectSection(item.key);
                if (isMobile) setIsMobileMenuOpen(false);
              }}
            >
              <Icon className="mr-3 h-5 w-5" />
              {item.label}
            </Button>
          );
        })}
      </nav>
      <div className="p-2 border-t border-border mt-auto">
        <Button
            variant={activeSection === 'settings' ? "secondary" : "ghost"}
            className={cn(
                "w-full justify-start text-sm",
                activeSection === 'settings' ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            onClick={() => {
                onSelectSection('settings');
                if (isMobile) setIsMobileMenuOpen(false);
            }}
            disabled // Settings not implemented yet
        >
          <Settings className="mr-3 h-5 w-5" />
          Settings
        </Button>
      </div>
    </div>
  );


  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-shrink-0">
         <div className="flex flex-col w-64 border-r border-border bg-card h-full">
            <SidebarContent />
         </div>
      </aside>

      {/* Mobile Sidebar (Sheet) */}
       <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetTrigger asChild className="md:hidden fixed top-4 left-4 z-50">
          <Button variant="outline" size="icon">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72 bg-card border-r border-border">
          <SidebarContent isMobile />
        </SheetContent>
      </Sheet>


      <div className="flex flex-col flex-1 w-full overflow-hidden">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-card px-4 md:px-6 shrink-0">
          <div className="md:hidden"></div> {/* Spacer for mobile to align title when menu button is present */}
          <h1 className="text-xl font-semibold text-foreground">{pageTitle}</h1>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
              {effectiveTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{username}</span>
              <Button variant="outline" size="sm" onClick={onLogout}>
                <LogoutIcon className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
