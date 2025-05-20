
"use client";

import React, { useEffect, useState, type FormEvent, type ReactNode } from 'react';
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
  Wrench, MapPin as JourneyIcon, Award, FileText as ResumeIcon, Mail as ContactIcon, 
  Settings as SettingsIcon, LayoutDashboard, Gavel as LegalIcon, Loader2, Save, Trash2, User as UserIcon,
  Image as ImageIcon, Link as LinkIcon, ListChecks, Languages, Building, GraduationCap, Tag as TagIcon, History, Filter, Eye, Send
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabaseClient'; 
import type { SiteSettings, User as SupabaseUser } from '@/types/supabase';
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle as AlertDialogPrimitiveTitle,
} from "@/components/ui/alert-dialog";

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

const ADMIN_SITE_SETTINGS_ID = 'global_settings'; 

const adminNavItems: AdminNavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'hero', label: 'Home Section', icon: HomeIcon },
  { key: 'about', label: 'About Section', icon: UserIcon },
  { key: 'projects', label: 'Projects', icon: Briefcase },
  { key: 'skills', label: 'Skills', icon: Wrench },
  { key: 'journey', label: 'Journey', icon: JourneyIcon },
  { key: 'certifications', label: 'Certifications', icon: Award },
  { key: 'resume', label: 'Resume', icon: ResumeIcon },
  { key: 'contact', label: 'Contact & Submissions', icon: ContactIcon },
  { key: 'legal', label: 'Legal Pages', icon: LegalIcon },
  { key: 'settings', label: 'Settings', icon: SettingsIcon },
];

function getPageTitle(sectionKey: string): string {
  const item = adminNavItems.find(navItem => navItem.key === sectionKey);
  return item ? item.label : "Portfolio Admin";
}

const DashboardOverview = () => (
    <Card className="shadow-lg">
        <CardHeader>
            <CardTitle>Welcome to your Dashboard</CardTitle>
            <CardDescription>Select a section from the sidebar to manage your portfolio content.</CardDescription>
        </CardHeader>
        <CardContent>
            <p>This is the main overview page. Use the navigation sidebar to manage different sections of your portfolio content.</p>
        </CardContent>
    </Card>
);


export default function AdminDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true); 

  const [emailInput, setEmailInput] = useState(''); 
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState('dashboard');

  // State for Site Settings
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [maintenanceMessageInput, setMaintenanceMessageInput] = useState('');

  // State for "Delete All Data" feature
  const [showDeleteAllDataPasswordModal, setShowDeleteAllDataPasswordModal] = useState(false);
  const [showDeleteAllDataConfirmModal, setShowDeleteAllDataConfirmModal] = useState(false);
  const [adminPasswordConfirm, setAdminPasswordConfirm] = useState('');
  const [deleteCountdown, setDeleteCountdown] = useState(5);
  const [isDeletingAllData, setIsDeletingAllData] = useState(false);
  const deleteCountdownIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsMounted(true);
    console.log("[AdminDashboardPage] Component mounted. Setting up auth listener.");

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[AdminDashboardPage] Auth state changed:", event, "Session user:", session?.user?.email);
      const user = session?.user ?? null;
      setCurrentUser(user);
      
      if (user) {
        // Dispatch custom event for header update
        window.dispatchEvent(new CustomEvent('authChange', { detail: { isAdminAuthenticated: true, username: user.email } }));
      } else {
        window.dispatchEvent(new CustomEvent('authChange', { detail: { isAdminAuthenticated: false, username: null } }));
      }
      
      setIsLoadingAuth(false); 

      if (event === 'SIGNED_OUT') {
        setEmailInput(''); 
        setPassword('');   
        setError('');      
        setActiveSection('dashboard'); 
        router.replace('/admin/dashboard'); 
      } else if (event === 'SIGNED_IN' && session?.user) {
         if (activeSection === 'settings') { 
             fetchSiteSettings();
         }
      }
    });
    
    const getInitialSession = async () => {
        console.log("[AdminDashboardPage] Checking initial session on mount.");
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
            console.error("[AdminDashboardPage] Error getting initial session:", sessionError);
        }
        console.log("[AdminDashboardPage] Initial session on mount:", session?.user?.email);
        const user = session?.user ?? null;
        if (user) {
            setCurrentUser(user);
            window.dispatchEvent(new CustomEvent('authChange', { detail: { isAdminAuthenticated: true, username: user.email } }));
            if (activeSection === 'settings') {
                fetchSiteSettings();
            }
        } else {
            window.dispatchEvent(new CustomEvent('authChange', { detail: { isAdminAuthenticated: false, username: null } }));
        }
        setIsLoadingAuth(false);
    };
    getInitialSession();

    return () => {
      console.log("[AdminDashboardPage] Unmounting, unsubscribing auth listener.");
      subscription?.unsubscribe();
    };
  }, [activeSection, router]);


  const fetchSiteSettings = async () => {
    console.log("[AdminDashboardPage] Fetching site settings...");
    setIsLoadingSettings(true);
    const { data, error: fetchError } = await supabase
      .from('site_settings')
      .select('is_maintenance_mode_enabled, maintenance_message')
      .eq('id', ADMIN_SITE_SETTINGS_ID)
      .maybeSingle();

    if (fetchError) {
      console.error("[AdminDashboardPage] Error fetching site settings:", fetchError);
      toast({ title: "Error", description: "Could not load site settings.", variant: "destructive" });
    } else if (data) {
      console.log("[AdminDashboardPage] Site settings fetched:", data);
      setIsMaintenanceMode(data.is_maintenance_mode_enabled);
      setMaintenanceMessageInput(data.maintenance_message || '');
    } else {
      console.log("[AdminDashboardPage] No site settings found, using defaults.");
    }
    setIsLoadingSettings(false);
  };

  const handleToggleMaintenanceMode = async (checked: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        toast({ title: "Auth Error", description: "Please log in to change settings.", variant: "destructive"});
        return;
    }
    setIsLoadingSettings(true);
    const { error: updateError } = await supabase
      .from('site_settings')
      .update({ is_maintenance_mode_enabled: checked, updated_at: new Date().toISOString() })
      .eq('id', ADMIN_SITE_SETTINGS_ID);

    if (updateError) {
      console.error("Error updating maintenance mode:", updateError);
      toast({ title: "Error", description: `Failed to update maintenance mode: ${updateError.message}`, variant: "destructive" });
    } else {
      setIsMaintenanceMode(checked);
      toast({ title: "Success", description: `Maintenance mode ${checked ? 'enabled' : 'disabled'}.` });
      try {
        await supabase.from('admin_activity_log').insert({
            action_type: checked ? 'MAINTENANCE_MODE_ENABLED' : 'MAINTENANCE_MODE_DISABLED',
            description: `Admin ${checked ? 'enabled' : 'disabled'} site maintenance mode.`,
            user_identifier: user.id 
        });
      } catch (logError) {
          console.error("Error logging maintenance mode toggle:", logError);
      }
    }
    setIsLoadingSettings(false);
  };
  
  const handleSaveMaintenanceMessage = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        toast({ title: "Auth Error", description: "Please log in to save settings.", variant: "destructive"});
        return;
    }
    setIsLoadingSettings(true);
    const { error: updateError } = await supabase
      .from('site_settings')
      .update({ maintenance_message: maintenanceMessageInput, updated_at: new Date().toISOString() })
      .eq('id', ADMIN_SITE_SETTINGS_ID);

    if (updateError) {
      console.error("Error saving maintenance message:", updateError);
      toast({ title: "Error", description: `Failed to save maintenance message: ${updateError.message}`, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Maintenance message saved." });
       try {
        await supabase.from('admin_activity_log').insert({
            action_type: 'MAINTENANCE_MESSAGE_UPDATED',
            description: `Admin updated the site maintenance message.`,
            user_identifier: user.id
        });
      } catch (logError) {
          console.error("Error logging maintenance message update:", logError);
      }
    }
    setIsLoadingSettings(false);
  };

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoadingAuth(true);
    
    const trimmedEmail = emailInput.trim();
    const trimmedPassword = password.trim();

    console.log("[AdminDashboardPage] Attempting Supabase login for email:", trimmedEmail);
    
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password: trimmedPassword, 
    });

    setIsLoadingAuth(false);

    if (signInError) {
      console.error("[AdminDashboardPage] Supabase Sign In Error:", signInError.message, signInError);
      setError(signInError.message || "Invalid login credentials.");
      toast({ title: "Login Failed", description: signInError.message || "Invalid login credentials.", variant: "destructive" });
    } else if (data.user) {
      console.log("[AdminDashboardPage] Supabase Login successful for user:", data.user.email);
      // setCurrentUser and dispatchEvent will be handled by onAuthStateChange listener
      toast({ title: "Login Successful", description: "Welcome to the admin dashboard." });
      try {
        await supabase.from('admin_activity_log').insert({ 
            action_type: 'ADMIN_LOGIN_SUCCESS', 
            description: `Admin "${data.user.email}" logged in successfully.`,
            user_identifier: data.user.id 
          });
      } catch (logError) {
        console.error("Error logging admin login:", logError);
      }
      // router.replace('/admin/dashboard'); // Let onAuthStateChange handle re-render
    } else {
        setError("An unexpected error occurred during login. No user data returned.");
        toast({ title: "Login Error", description: "An unexpected error occurred. Please try again.", variant: "destructive" });
    }
  };

  const handleLogout = async () => {
    if (!currentUser) return;
    const userIdForLog = currentUser.id;
    const userEmailForLog = currentUser.email || "Admin"; 
    console.log(`[AdminDashboardPage] Attempting Supabase logout for user: ${userEmailForLog}`);
    
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
        console.error("[AdminDashboardPage] Error signing out:", signOutError);
        toast({ title: "Logout Error", description: signOutError.message, variant: "destructive"});
    } else {
        console.log("[AdminDashboardPage] Supabase Logout successful.");
        toast({ title: "Logged Out", description: "You have been successfully logged out." });
        try {
          await supabase.from('admin_activity_log').insert({ 
              action_type: 'ADMIN_LOGOUT', 
              description: `Admin "${userEmailForLog}" logged out.`,
              user_identifier: userIdForLog 
            });
        } catch (logError) {
          console.error("Error logging admin logout:", logError);
        }
        // onAuthStateChange will set currentUser to null and trigger UI update/redirect
    }
  };

  const handleInitiateDeleteAllData = () => {
    if (!currentUser) {
        toast({ title: "Authentication Error", description: "You must be logged in to perform this action.", variant: "destructive"});
        return;
    }
    setAdminPasswordConfirm('');
    setShowDeleteAllDataPasswordModal(true);
  };

  const handlePasswordConfirmForDelete = async () => {
    if (!currentUser || !currentUser.email) {
      toast({ title: "Authentication Error", description: "Cannot verify password without a logged-in user.", variant: "destructive"});
      return;
    }
    
    const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: currentUser.email,
        password: adminPasswordConfirm,
    });

    if (reauthError) {
        console.error("[AdminDashboardPage] Re-authentication for delete failed:", reauthError);
        toast({ title: "Password Incorrect", description: "The admin password entered is incorrect.", variant: "destructive"});
        return;
    }

    setShowDeleteAllDataPasswordModal(false);
    setAdminPasswordConfirm(''); 
    setShowDeleteAllDataConfirmModal(true);
    setDeleteCountdown(5); 
    if (deleteCountdownIntervalRef.current) clearInterval(deleteCountdownIntervalRef.current);
    deleteCountdownIntervalRef.current = setInterval(() => {
      setDeleteCountdown(prev => {
        if (prev <= 1) {
          if (deleteCountdownIntervalRef.current) clearInterval(deleteCountdownIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleFinalDeleteAllData = async () => {
    if (!currentUser) {
        toast({ title: "Authentication Error", description: "Action aborted. User not authenticated.", variant: "destructive"});
        return;
    }
    if (deleteCountdown > 0) {
      toast({ title: "Cannot Delete Yet", description: "Please wait for the countdown to finish.", variant: "default"});
      return;
    }
    setIsDeletingAllData(true);
    toast({ title: "Processing Deletion", description: "Attempting to delete all portfolio data and related storage files..."});

    try {
      console.log('[AdminDashboardPage] Invoking danger-delete-all-data Edge Function.');
      const { error: functionError, data: functionData } = await supabase.functions.invoke('danger-delete-all-data');

      if (functionError) {
        console.error("[AdminDashboardPage] Error invoking Edge Function (raw):", JSON.stringify(functionError, null, 2));
        let detailedMessage = functionError.message;
        if (functionError.message.includes("Function not found")) {
            detailedMessage = "The 'danger-delete-all-data' Edge Function could not be found. Please ensure it's deployed correctly in your Supabase project.";
        } else if (functionError.message.includes("FetchError")) {
            detailedMessage = "Failed to connect to the Edge Function. Please check your network or Supabase function status.";
        }
        throw new Error(detailedMessage);
      }
      
      if (functionData && functionData.error) {
         console.error("[AdminDashboardPage] Error returned from Edge Function logic:", JSON.stringify(functionData.error, null, 2));
         // Try to parse if functionData.error is a stringified JSON
         let parsedFuncError = functionData.error;
         if (typeof functionData.error === 'string') {
            try {
                const errObj = JSON.parse(functionData.error);
                if (errObj.message) parsedFuncError = errObj.message;
            } catch (e) { /* ignore parsing error */ }
         }
         throw new Error(typeof parsedFuncError === 'string' ? parsedFuncError : "An error occurred in the Edge Function.");
      }

      toast({ title: "Success", description: functionData?.message || "All portfolio data and storage file deletion process initiated successfully.", duration: 7000 });
      await supabase.from('admin_activity_log').insert({
        action_type: 'DATA_DELETION_INITIATED',
        description: 'Admin initiated deletion of all portfolio data and associated storage files.',
        user_identifier: currentUser.id 
      });
      setActiveSection('dashboard'); 
      router.refresh(); 
    } catch (err: any) {
      console.error("[AdminDashboardPage] Caught error after trying to invoke Edge Function:", err);
      toast({ title: "Deletion Failed", description: err.message || "Failed to initiate data deletion. Check Edge Function & browser console logs.", variant: "destructive" });
    } finally {
      setIsDeletingAllData(false);
      setShowDeleteAllDataConfirmModal(false);
    }
  };

  useEffect(() => {
    return () => {
      if (deleteCountdownIntervalRef.current) {
        clearInterval(deleteCountdownIntervalRef.current);
      }
    };
  }, []);


  if (!isMounted || isLoadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Loading authentication state...</p>
      </div>
    );
  }

  if (!currentUser) {
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
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} placeholder="your.email@example.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
              </div>
              {error && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Login Failed</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
              <Button type="submit" className="w-full text-lg py-3" disabled={isLoadingAuth}><LogIn className="mr-2 h-5 w-5" /> {isLoadingAuth ? 'Logging in...' : 'Log In'}</Button>
            </form>
          </CardContent>
           <CardFooter className="mt-6 flex flex-col items-center space-y-2">
             <Link href="/" className={cn(buttonVariants({ variant: "link" }), "text-muted-foreground hover:text-primary p-0 h-auto")}>
                <span>
                    <HomeIcon className="mr-2 h-4 w-4 inline-block" />Back to Portfolio
                </span>
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
      username={currentUser.email || "Admin"}
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
        <div className="space-y-8">
            <Card className="shadow-lg">
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
                        <Button onClick={handleSaveMaintenanceMessage} disabled={isLoadingSettings} size="sm">
                            {isLoadingSettings ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4"/>}
                            Save Message
                        </Button>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>

            <Card className="border-destructive shadow-lg">
                <CardHeader>
                    <CardTitle className="text-destructive flex items-center gap-2"><AlertTriangle className="h-6 w-6"/>Danger Zone</CardTitle>
                    <CardDescription className="text-destructive/80">These actions are irreversible and can lead to data loss.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-semibold text-lg text-destructive">Delete All Portfolio Data</h4>
                            <p className="text-sm text-destructive/80 mb-3">
                                This will attempt to delete all content from your portfolio database tables (projects, skills, about, resume, etc.) AND associated files from Supabase Storage (images, PDFs). 
                                This does **not** delete your admin profile or core site settings. This action is irreversible.
                            </p>
                            <Button variant="destructive" onClick={handleInitiateDeleteAllData} disabled={isDeletingAllData || !currentUser}>
                                {isDeletingAllData ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                                Delete All Portfolio Data & Files
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      )}

      <AlertDialog open={showDeleteAllDataPasswordModal} onOpenChange={setShowDeleteAllDataPasswordModal}>
        <AlertDialogContent className="bg-destructive border-destructive text-destructive-foreground">
          <AlertDialogHeader>
            <AlertDialogPrimitiveTitle className="text-destructive-foreground">Confirm Admin Password</AlertDialogPrimitiveTitle>
            <AlertDialogDescription className="text-destructive-foreground/90">
              To proceed with deleting all portfolio data and associated storage files, please re-enter your admin password. This is a critical action and serves as a re-authentication step.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="adminPasswordConfirmDelete" className="text-destructive-foreground/90">Admin Password</Label>
            <Input 
              id="adminPasswordConfirmDelete" 
              type="password" 
              value={adminPasswordConfirm}
              onChange={(e) => setAdminPasswordConfirm(e.target.value)}
              className="bg-destructive-foreground/10 border-destructive-foreground/30 text-destructive-foreground placeholder:text-destructive-foreground/50 focus:ring-destructive-foreground"
              placeholder="Enter your admin password"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => setShowDeleteAllDataPasswordModal(false)}
              className={cn(buttonVariants({ variant: "outline" }), "border-destructive-foreground/40 text-destructive-foreground", "hover:bg-destructive-foreground/10 hover:text-destructive-foreground hover:border-destructive-foreground/60")}
            >Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handlePasswordConfirmForDelete}
              className={cn(buttonVariants({ variant: "default" }), "bg-destructive-foreground text-destructive", "hover:bg-destructive-foreground/90")}
            >Proceed</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteAllDataConfirmModal} onOpenChange={setShowDeleteAllDataConfirmModal}>
        <AlertDialogContent className="bg-destructive border-destructive text-destructive-foreground">
          <AlertDialogHeader>
            <AlertDialogPrimitiveTitle className="text-destructive-foreground">FINAL CONFIRMATION: DELETE ALL DATA & FILES?</AlertDialogPrimitiveTitle>
            <AlertDialogDescription className="text-destructive-foreground/90">
              This action is **IRREVERSIBLE** and will delete all content from your portfolio database tables AND all files in associated storage buckets (project images, icons, PDFs, etc.). 
              Admin profile and core site settings will NOT be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 text-center">
            <p className="text-lg text-destructive-foreground/90">
              Button will be enabled in <span className="font-bold text-xl">{deleteCountdown}</span> second{deleteCountdown !== 1 ? 's' : ''}.
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setShowDeleteAllDataConfirmModal(false);
                if (deleteCountdownIntervalRef.current) clearInterval(deleteCountdownIntervalRef.current);
              }}
              className={cn(buttonVariants({ variant: "outline" }), "border-destructive-foreground/40 text-destructive-foreground", "hover:bg-destructive-foreground/10 hover:text-destructive-foreground hover:border-destructive-foreground/60")}
            >Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleFinalDeleteAllData} 
              disabled={deleteCountdown > 0 || isDeletingAllData}
              className={cn(
                buttonVariants({ variant: "default" }), 
                "bg-destructive-foreground text-destructive", 
                "hover:bg-destructive-foreground/90",
                (deleteCountdown > 0 || isDeletingAllData) && "opacity-50 cursor-not-allowed"
              )}
            >
              {isDeletingAllData ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirm Deletion
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </AdminPageLayout>
  );
}
    

    