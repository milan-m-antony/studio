
"use client";

import React, { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { 
  ShieldCheck, LogOut, AlertTriangle, LogIn, Home as HomeIcon, Users, Briefcase, 
  Wrench, MapPin as JourneyIcon, Award, FileText as ResumeIcon, Mail, 
  Settings as SettingsIcon, LayoutDashboard, Gavel as LegalIcon, Loader2 
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabaseClient'; 
import type { SiteSettings } from '@/types/supabase';
import { useToast } from "@/hooks/use-toast"; // Import useToast

// Import Admin Managers
import HeroManager from '@/components/admin/HeroManager';
import AboutManager from '@/components/admin/AboutManager';
import ProjectsManager from '@/components/admin/ProjectsManager';
import SkillsManager from '@/components/admin/SkillsManager';
import TimelineManager from '@/components/admin/TimelineManager';
import CertificationsManager from '@/components/admin/CertificationsManager';
import ResumeManager from '@/components/admin/ResumeManager';
import ContactManager from '@/components/admin/ContactManager';
import LegalManager from '@/components/admin/LegalManager';
import AdminPageLayout, { type AdminNavItem } from '@/components/admin/AdminPageLayout';

const ADMIN_SITE_SETTINGS_ID = 'global_settings'; // Fixed ID for site_settings row

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
  { key: 'legal', label: 'Legal Pages', icon: LegalIcon },
  { key: 'settings', label: 'Settings', icon: SettingsIcon },
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
            <p>This is the main overview page. Use the sidebar to navigate to different content management sections.</p>
        </CardContent>
    </Card>
);


export default function AdminDashboardPage() {
  const router = useRouter();
  const { toast } = useToast(); // Initialize useToast
  const [isMounted, setIsMounted] = useState(false);
  const [isAuthenticatedForRender, setIsAuthenticatedForRender] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState('dashboard');

  // State for Site Settings / Maintenance Mode
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [maintenanceMessageInput, setMaintenanceMessageInput] = useState(''); // For editing message

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      const authStatus = localStorage.getItem('isAdminAuthenticated') === 'true';
      setIsAuthenticatedForRender(authStatus);
      if (authStatus && activeSection === 'settings') {
        fetchSiteSettings();
      }
    }
  }, [activeSection]); // Re-fetch settings if settings tab becomes active

  const fetchSiteSettings = async () => {
    setIsLoadingSettings(true);
    const { data, error } = await supabase
      .from('site_settings')
      .select('is_maintenance_mode_enabled, maintenance_message')
      .eq('id', ADMIN_SITE_SETTINGS_ID)
      .maybeSingle();

    if (error) {
      console.error("Error fetching site settings:", error);
      toast({ title: "Error", description: "Could not load site settings.", variant: "destructive" });
    } else if (data) {
      setIsMaintenanceMode(data.is_maintenance_mode_enabled);
      setMaintenanceMessageInput(data.maintenance_message || '');
    }
    setIsLoadingSettings(false);
  };

  const handleToggleMaintenanceMode = async (checked: boolean) => {
    setIsLoadingSettings(true);
    const { error } = await supabase
      .from('site_settings')
      .update({ is_maintenance_mode_enabled: checked, updated_at: new Date().toISOString() })
      .eq('id', ADMIN_SITE_SETTINGS_ID);

    if (error) {
      console.error("Error updating maintenance mode:", error);
      toast({ title: "Error", description: "Failed to update maintenance mode.", variant: "destructive" });
    } else {
      setIsMaintenanceMode(checked);
      toast({ title: "Success", description: `Maintenance mode ${checked ? 'enabled' : 'disabled'}.` });
      // Log activity
      await supabase.from('admin_activity_log').insert({
        action_type: checked ? 'MAINTENANCE_MODE_ENABLED' : 'MAINTENANCE_MODE_DISABLED',
        description: `Admin ${checked ? 'enabled' : 'disabled'} site maintenance mode.`,
        user_identifier: process.env.NEXT_PUBLIC_ADMIN_USERNAME || 'admin'
      });
    }
    setIsLoadingSettings(false);
  };
  
  const handleSaveMaintenanceMessage = async () => {
    setIsLoadingSettings(true);
    const { error } = await supabase
      .from('site_settings')
      .update({ maintenance_message: maintenanceMessageInput, updated_at: new Date().toISOString() })
      .eq('id', ADMIN_SITE_SETTINGS_ID);

    if (error) {
      console.error("Error saving maintenance message:", error);
      toast({ title: "Error", description: "Failed to save maintenance message.", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Maintenance message saved." });
      // Log activity
      await supabase.from('admin_activity_log').insert({
        action_type: 'MAINTENANCE_MESSAGE_UPDATED',
        description: `Admin updated the site maintenance message.`,
        user_identifier: process.env.NEXT_PUBLIC_ADMIN_USERNAME || 'admin'
      });
    }
    setIsLoadingSettings(false);
  };


  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    const expectedUsername = process.env.NEXT_PUBLIC_ADMIN_USERNAME;
    const expectedPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
    
    const usernameMatch = trimmedUsername === expectedUsername;
    const passwordMatch = trimmedPassword === expectedPassword;

    if (usernameMatch && passwordMatch) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('isAdminAuthenticated', 'true');
        window.dispatchEvent(new CustomEvent('authChange'));
      }
      setIsAuthenticatedForRender(true);
      toast({ title: "Login Successful", description: "Welcome to the admin dashboard." });
      try {
        await supabase.from('admin_activity_log').insert({ 
            action_type: 'ADMIN_LOGIN_SUCCESS', 
            description: `Admin "${trimmedUsername}" logged in successfully.`,
            user_identifier: trimmedUsername
          });
      } catch (logError) {
        console.error("Error logging admin login:", logError);
      }
    } else {
      setError("Invalid username or password.");
      toast({ title: "Login Failed", description: "Invalid username or password.", variant: "destructive" });
      setIsAuthenticatedForRender(false);
    }
  };

  const handleLogout = async () => {
    const adminUsername = process.env.NEXT_PUBLIC_ADMIN_USERNAME || "Admin";
    if (typeof window !== 'undefined') {
      localStorage.removeItem('isAdminAuthenticated');
      window.dispatchEvent(new CustomEvent('authChange'));
    }
    setIsAuthenticatedForRender(false);
    setUsername('');
    setPassword('');
    setActiveSection('dashboard'); 
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
    try {
      await supabase.from('admin_activity_log').insert({ 
          action_type: 'ADMIN_LOGOUT', 
          description: `Admin "${adminUsername}" logged out.`,
          user_identifier: adminUsername
        });
    } catch (logError) {
      console.error("Error logging admin logout:", logError);
    }
    router.push('/admin/dashboard'); 
  };

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Loading dashboard...</p>
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
      username={process.env.NEXT_PUBLIC_ADMIN_USERNAME || "Admin"}
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
      {activeSection === 'legal' && <LegalManager />} 
      {activeSection === 'settings' && (
        <Card>
          <CardHeader>
            <CardTitle>Site Settings</CardTitle>
            <CardDescription>Manage global site settings and configurations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-xl">Site Availability</CardTitle>
                <CardDescription>Control whether your site is live or in maintenance mode.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 border rounded-lg shadow-sm bg-card-foreground/5 dark:bg-card-foreground/10">
                  <div>
                    <Label htmlFor="maintenance-mode-switch" className="font-semibold text-lg cursor-pointer">
                      Maintenance Mode
                    </Label>
                    <p className="text-sm text-muted-foreground max-w-md">
                      When enabled, visitors will see a maintenance page.
                      You can still access the admin dashboard.
                    </p>
                  </div>
                  {isLoadingSettings ? (
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  ) : (
                    <Switch
                      id="maintenance-mode-switch"
                      checked={isMaintenanceMode}
                      onCheckedChange={handleToggleMaintenanceMode}
                      aria-label="Toggle maintenance mode"
                      className="data-[state=checked]:bg-destructive data-[state=unchecked]:bg-muted"
                    />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  {isMaintenanceMode 
                    ? "Site is currently IN MAINTENANCE MODE. Only admins may see full content." 
                    : "Site is currently LIVE and accessible to all visitors."}
                </p>
                 
                 <div className="mt-6 pt-6 border-t">
                    <Label htmlFor="maintenanceMessage" className="font-semibold text-lg block mb-2">Maintenance Page Message</Label>
                    <Textarea 
                        id="maintenanceMessage"
                        value={maintenanceMessageInput}
                        onChange={(e) => setMaintenanceMessageInput(e.target.value)}
                        placeholder="Our site is currently undergoing scheduled maintenance. We expect to be back online shortly. Thank you for your patience!"
                        rows={4}
                        className="mb-2"
                        disabled={isLoadingSettings}
                    />
                    <Button onClick={handleSaveMaintenanceMessage} disabled={isLoadingSettings}>
                        {isLoadingSettings ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Save Message
                    </Button>
                 </div>
              </CardContent>
            </Card>
            {/* Add other settings sections/cards here as needed */}
          </CardContent>
        </Card>
      )}
    </AdminPageLayout>
  );
}
