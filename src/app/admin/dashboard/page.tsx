
"use client";

import React, { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldCheck, LogOut, AlertTriangle, LogIn, Home as HomeIcon, Users, Briefcase, Wrench, MapPin as JourneyIcon, Award, FileText as ResumeIcon, Mail, Settings as SettingsIcon, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// Import Admin Managers
import HeroManager from '@/components/admin/HeroManager';
import AboutManager from '@/components/admin/AboutManager';
import ProjectsManager from '@/components/admin/ProjectsManager';
import SkillsManager from '@/components/admin/SkillsManager';
import TimelineManager from '@/components/admin/TimelineManager';
import CertificationsManager from '@/components/admin/CertificationsManager';
import ResumeManager from '@/components/admin/ResumeManager';
import ContactManager from '@/components/admin/ContactManager';
import AdminPageLayout, { type AdminNavItem } from '@/components/admin/AdminPageLayout';


const adminNavItems: AdminNavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'hero', label: 'Home Section', icon: HomeIcon },
  { key: 'about', label: 'About Section', icon: Users },
  { key: 'projects', label: 'Projects', icon: Briefcase },
  { key: 'skills', label: 'Skills', icon: Wrench },
  { key: 'journey', label: 'Journey', icon: JourneyIcon },
  { key: 'certifications', label: 'Certifications', icon: Award },
  { key: 'resume', label: 'Resume', icon: ResumeIcon },
  { key: 'contact', label: 'Contact & Submissions', icon: Mail },
  // { key: 'settings', label: 'Settings', icon: SettingsIcon }, // Future
];

function getPageTitle(sectionKey: string): string {
  const item = adminNavItems.find(navItem => navItem.key === sectionKey);
  return item ? item.label : "Portfolio Admin";
}

const DashboardOverview = () => (
    <Card>
        <CardHeader>
            <CardTitle>Welcome to your Dashboard</CardTitle>
            <CardDescription>Select a section from the sidebar to manage your portfolio content.</CardDescription>
        </CardHeader>
        <CardContent>
            <p>This is the main overview page. More widgets and summaries can be added here in the future.</p>
        </CardContent>
    </Card>
);


export default function AdminDashboardPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [isAuthenticatedForRender, setIsAuthenticatedForRender] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState('dashboard'); // Default section

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      const authStatus = localStorage.getItem('isAdminAuthenticated') === 'true';
      setIsAuthenticatedForRender(authStatus);
      // Restore username if needed for display, or if you implement "remember me"
      // const storedUsername = localStorage.getItem('adminUsername');
      // if (authStatus && storedUsername) setUsername(storedUsername);
    }
  }, []);

  const handleLoginSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    const expectedUsername = process.env.NEXT_PUBLIC_ADMIN_USERNAME;
    const expectedPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

    if (trimmedUsername === expectedUsername && trimmedPassword === expectedPassword) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('isAdminAuthenticated', 'true');
        // localStorage.setItem('adminUsername', trimmedUsername); // Optional: store username
        window.dispatchEvent(new CustomEvent('authChange'));
      }
      setIsAuthenticatedForRender(true);
    } else {
      setError("Invalid username or password.");
      setIsAuthenticatedForRender(false);
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('isAdminAuthenticated');
      // localStorage.removeItem('adminUsername'); // Optional: clear stored username
      window.dispatchEvent(new CustomEvent('authChange'));
    }
    setIsAuthenticatedForRender(false);
    setUsername('');
    setPassword('');
    setActiveSection('dashboard'); // Reset to dashboard view on logout
    router.push('/admin/dashboard'); // Ensure user is on the login view
  };

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  if (!isAuthenticatedForRender) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black p-4">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-primary rounded-full inline-block">
              <ShieldCheck className="h-10 w-10 text-primary-foreground" />
            </div>
            <CardTitle className="text-3xl font-bold">Admin Access</CardTitle>
            <CardDescription>Please log in to manage portfolio content.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLoginSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="your_username" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
              </div>
              {error && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Login Failed</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
              <Button type="submit" className="w-full text-lg py-3"><LogIn className="mr-2 h-5 w-5" /> Log In</Button>
            </form>
          </CardContent>
           <CardFooter className="mt-6 flex flex-col items-center space-y-2">
             <Link href="/" className={cn(buttonVariants({ variant: "link" }), "text-muted-foreground hover:text-primary p-0 h-auto")}>
                <HomeIcon className="mr-2 h-4 w-4 inline-block" />Back to Portfolio
             </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <AdminPageLayout
      navItems={adminNavItems}
      activeSection={activeSection}
      onSelectSection={setActiveSection}
      onLogout={handleLogout}
      username={process.env.NEXT_PUBLIC_ADMIN_USERNAME || "Admin"} // Display logged-in username
      pageTitle={getPageTitle(activeSection)}
    >
      {activeSection === 'dashboard' && <DashboardOverview />}
      {activeSection === 'hero' && <HeroManager />}
      {activeSection === 'about' && <AboutManager />}
      {activeSection === 'projects' && <ProjectsManager />}
      {activeSection === 'skills' && <SkillsManager />}
      {activeSection === 'journey' && <TimelineManager />}
      {activeSection === 'certifications' && <CertificationsManager />}
      {activeSection === 'resume' && <ResumeManager />}
      {activeSection === 'contact' && <ContactManager />}
      {/* Add other sections here */}
      {activeSection === 'settings' && (
        <Card>
          <CardHeader><CardTitle>Settings</CardTitle><CardDescription>Site settings and account actions.</CardDescription></CardHeader>
          <CardContent><p>Settings management coming soon.</p></CardContent>
        </Card>
      )}
    </AdminPageLayout>
  );
}
