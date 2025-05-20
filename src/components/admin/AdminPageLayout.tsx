
"use client";

import Link from 'next/link';
import NextImage from 'next/image';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle as SheetPrimitiveTitle,
  SheetDescription, SheetFooter
} from '@/components/ui/sheet';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader as DialogPrimitiveHeader, DialogTitle as DialogPrimitiveDialogTitle, DialogClose
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter as AlertDialogPrimitiveFooter, // Aliased to avoid conflict if CardFooter used
  AlertDialogHeader as AlertDialogPrimitiveHeader,
  AlertDialogTitle as AlertDialogPrimitiveAlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/lib/supabaseClient';
import type { AdminActivityLog, AdminProfile, User } from '@/types/supabase';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Menu, X, Sun, Moon,
  LogOut as LogoutIcon, Bell as BellIcon, UserCircle, Settings as SettingsIcon,
  UploadCloud, Trash2, History, ChevronRight, ChevronLeft, KeyRound, Mail as MailIcon, Image as ImageIcon
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeProvider';
import { cn } from '@/lib/utils';
import React, { useState, useEffect, type ChangeEvent, type ReactNode, useCallback } from 'react';
import { format, parseISO, isValid as isValidDate } from 'date-fns';

const ADMIN_PROFILE_ID = '00000000-0000-0000-0000-00000000000A'; 

export interface AdminNavItem {
  key: string;
  label: string;
  icon: LucideIcon;
  href?: string;
}

interface SidebarContentProps {
  isMobile?: boolean;
  isCollapsed?: boolean;
  navItems: AdminNavItem[];
  activeSection: string;
  onSelectSection: (sectionKey: string) => void;
  onCloseMobileSheet?: () => void;
  toggleSidebarCollapse?: () => void;
}

const SidebarContent = ({
  isMobile = false,
  isCollapsed = false,
  navItems,
  activeSection,
  onSelectSection,
  onCloseMobileSheet,
  toggleSidebarCollapse,
}: SidebarContentProps) => (
    <div className={cn("flex flex-col h-full bg-sidebar text-sidebar-foreground", isMobile ? "w-full" : "")}>
      <div className={cn(
        "border-b border-sidebar-border flex items-center h-16 shrink-0",
        isCollapsed && !isMobile ? "px-2 justify-center" : "px-4 justify-between"
      )}>
        <Link
          href="/admin/dashboard"
          className={cn(
            "flex items-center",
            isCollapsed && !isMobile ? "justify-center w-full" : ""
          )}
          onClick={() => {
            onSelectSection('dashboard');
            if (isMobile && onCloseMobileSheet) onCloseMobileSheet();
          }}
          aria-label="Go to admin dashboard"
        >
           <div className={cn(
            "relative rounded-full overflow-hidden border border-sidebar-accent flex-shrink-0",
            isCollapsed && !isMobile ? "h-8 w-8" : "h-10 w-10"
          )}>
            <NextImage
              src="/logo.png" 
              alt="Portfolio Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </Link>
        {!isMobile && toggleSidebarCollapse && (
           <Button variant="ghost" size="icon" onClick={toggleSidebarCollapse} className="h-8 w-8 text-sidebar-foreground/70 hover:text-sidebar-foreground">
            {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
        )}
      </div>

      <ScrollArea className="flex-grow">
        <nav className={cn(
          "space-y-1",
          isCollapsed && !isMobile ? "px-4 py-2 flex flex-col items-center" : "p-2"
        )}>
          {navItems.filter(item => item.key !== 'settings').map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.key;
            return (
              <Button
                key={item.key}
                variant="ghost"
                className={cn(
                  "w-full text-sm rounded-lg group",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  isCollapsed && !isMobile
                    ? "justify-center py-2.5 px-0" 
                    : "justify-start py-2.5 px-3"
                )}
                onClick={() => {
                  onSelectSection(item.key);
                  if (isMobile && onCloseMobileSheet) onCloseMobileSheet();
                }}
                title={isCollapsed && !isMobile ? item.label : undefined}
              >
                <Icon className={cn(
                  "h-5 w-5 flex-shrink-0",
                  isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground",
                  isCollapsed && !isMobile ? "mx-auto" : "mr-2" 
                )} />
                {(!isCollapsed || isMobile) && (
                  <span className="overflow-hidden whitespace-nowrap text-ellipsis">{item.label}</span>
                )}
              </Button>
            );
          })}
        </nav>
      </ScrollArea>

      <div className={cn(
          "mt-auto border-t border-sidebar-border shrink-0",
           isCollapsed && !isMobile ? "px-4 py-2 flex flex-col items-center" : "p-2"
      )}>
        {navItems.find(item => item.key === 'settings') && (() => {
          const settingsItem = navItems.find(item => item.key === 'settings')!;
          const Icon = settingsItem.icon;
          const isActive = activeSection === settingsItem.key;
          return (
            <Button
              variant="ghost"
              className={cn(
                "w-full text-sm rounded-lg group",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isCollapsed && !isMobile
                  ? "justify-center py-2.5 px-0"
                  : "justify-start py-2.5 px-3"
              )}
              onClick={() => {
                onSelectSection(settingsItem.key);
                if (isMobile && onCloseMobileSheet) onCloseMobileSheet();
              }}
              title={isCollapsed && !isMobile ? settingsItem.label : undefined}
            >
              <Icon className={cn(
                "h-5 w-5 flex-shrink-0",
                isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground",
                isCollapsed && !isMobile ? "mx-auto" : "mr-2"
              )} />
              {(!isCollapsed || isMobile) && (
                <span className="overflow-hidden whitespace-nowrap text-ellipsis">
                  {settingsItem.label}
                </span>
              )}
            </Button>
          );
        })()}
      </div>
    </div>
  );

interface AdminPageLayoutProps {
  navItems: AdminNavItem[];
  activeSection: string;
  onSelectSection: (sectionKey: string) => void;
  onLogout: () => void;
  username: string | null; 
  pageTitle: string;
  children: ReactNode;
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
  const [headerIsMounted, setHeaderIsMounted] = useState(false);
  const [currentThemeIcon, setCurrentThemeIcon] = useState<ReactNode>(<div className="h-5 w-5" />);

  const [isActivitySheetOpen, setIsActivitySheetOpen] = useState(false);
  const [activities, setActivities] = useState<AdminActivityLog[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [showClearLogConfirm, setShowClearLogConfirm] = useState(false);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { toast } = useToast();

  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [currentDbProfilePhotoUrl, setCurrentDbProfilePhotoUrl] = useState<string | null>(null);
  
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordChangeError, setPasswordChangeError] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const fetchAdminProfile = useCallback(async () => {
    console.log("[AdminPageLayout] Fetching admin profile photo...");
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
        setProfilePhotoUrl(null); 
        setCurrentDbProfilePhotoUrl(null);
        setProfilePhotoPreview(null);
        return;
    }
    const { data, error } = await supabase
      .from('admin_profile')
      .select('profile_photo_url')
      .eq('id', ADMIN_PROFILE_ID) 
      .maybeSingle();

    if (error) {
      console.error("[AdminPageLayout] Error fetching admin profile photo:", error);
    } else if (data && data.profile_photo_url) {
      setProfilePhotoUrl(data.profile_photo_url);
      setCurrentDbProfilePhotoUrl(data.profile_photo_url);
      setProfilePhotoPreview(data.profile_photo_url); 
    } else {
      setProfilePhotoUrl(null);
      setCurrentDbProfilePhotoUrl(null);
      setProfilePhotoPreview(null);
    }
  }, [toast]);

  useEffect(() => {
    setHeaderIsMounted(true);
    fetchAdminProfile(); 
    
    const savedSidebarState = localStorage.getItem('sidebarCollapsed');
    if (savedSidebarState) {
      setIsSidebarCollapsed(JSON.parse(savedSidebarState));
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        fetchAdminProfile();
      } else if (event === 'SIGNED_OUT') {
        setProfilePhotoUrl(null);
        setCurrentDbProfilePhotoUrl(null);
        setProfilePhotoPreview(null);
      }
    });
    return () => subscription?.unsubscribe();
  }, [fetchAdminProfile]);

  useEffect(() => {
    if (headerIsMounted) {
        localStorage.setItem('sidebarCollapsed', JSON.stringify(isSidebarCollapsed));
    }
  }, [isSidebarCollapsed, headerIsMounted]);

  const toggleSidebarCollapse = useCallback(() => {
    setIsSidebarCollapsed(prev => !prev);
  }, []);

  useEffect(() => {
    if (headerIsMounted) {
      let currentEffectiveTheme = theme;
      if (theme === 'system' && typeof window !== 'undefined') {
        currentEffectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      setCurrentThemeIcon(currentEffectiveTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />);
    }
  }, [theme, headerIsMounted]);

  const toggleTheme = () => {
    if (!headerIsMounted) return;
    let currentEffectiveTheme = theme;
    if (theme === 'system' && typeof window !== 'undefined') {
        currentEffectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    const newThemeToSet = currentEffectiveTheme === 'dark' ? 'light' : 'dark';
    setTheme(newThemeToSet);
  };

  const fetchActivities = async () => {
    setIsLoadingActivities(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsLoadingActivities(false); return; }
    const { data, error } = await supabase
      .from('admin_activity_log')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(50);
    if (error) {
      toast({ title: "Error", description: "Could not fetch recent activities.", variant: "destructive" });
      setActivities([]);
    } else setActivities(data || []);
    setIsLoadingActivities(false);
  };

  useEffect(() => {
    if (isActivitySheetOpen) fetchActivities();
  }, [isActivitySheetOpen]);

  const handleClearActivityLog = async () => {
    setIsLoadingActivities(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        toast({ title: "Authentication Error", description: "You must be logged in to clear logs.", variant: "destructive" });
        setIsLoadingActivities(false); return;
    }
    const { error } = await supabase.from('admin_activity_log').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) {
      toast({ title: "Error", description: `Failed to clear activity log: ${error.message}`, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Activity log cleared." });
      setActivities([]);
      await supabase.from('admin_activity_log').insert({ action_type: 'ACTIVITY_LOG_CLEARED', description: `Admin ${user.email || user.id} cleared the activity log.`, user_identifier: user.id });
    }
    setShowClearLogConfirm(false);
    setIsLoadingActivities(false);
  };

  const getUserInitials = (name: string | null | undefined) => {
    if (!name) return "AD";
    if (name.includes('@')) {
      const emailPrefix = name.split('@')[0];
      if (emailPrefix.length >= 2) return emailPrefix.substring(0, 2).toUpperCase();
      if (emailPrefix.length === 1) return emailPrefix.toUpperCase() + "X";
      return "AD";
    }
    const parts = name.split(/[\s_]+/);
    if (parts.length > 0 && parts[0]) {
        if (parts.length > 1 && parts[1] && parts[1].length > 0) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        return parts[0].substring(0, 2).toUpperCase();
    }
    return "AD";
  };

  const handleProfilePhotoFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setProfilePhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setProfilePhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setProfilePhotoFile(null);
      setProfilePhotoPreview(currentDbProfilePhotoUrl);
    }
  };

  const handleSaveProfilePhoto = async () => {
    setIsUploadingPhoto(true);
    let newPhotoUrlToSave = currentDbProfilePhotoUrl;
    const {data: { user: currentUserForUpdate } } = await supabase.auth.getUser();
    if (!currentUserForUpdate) {
        toast({ title: "Auth Error", description: "Please log in again to update profile photo.", variant: "destructive"});
        setIsUploadingPhoto(false); return;
    }

    let oldImageStoragePathToDelete: string | null = null;
    if (currentDbProfilePhotoUrl) {
        try {
            const url = new URL(currentDbProfilePhotoUrl);
            const pathParts = url.pathname.split('/admin-profile-photos/');
            if (pathParts.length > 1 && !pathParts[1].startsWith('http')) oldImageStoragePathToDelete = decodeURIComponent(pathParts[1]);
        } catch(e) { console.warn("[AdminPageLayout] Could not parse currentDbProfilePhotoUrl for deletion:", currentDbProfilePhotoUrl, e); }
    }

    if (profilePhotoFile) {
      const fileExt = profilePhotoFile.name.split('.').pop();
      const fileName = `admin_profile_${currentUserForUpdate.id}_${Date.now()}.${fileExt}`;
      
      console.log('[AdminPageLayout] Attempting to upload new profile photo:', fileName);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('admin-profile-photos')
        .upload(fileName, profilePhotoFile, { cacheControl: '3600', upsert: false });

      if (uploadError) {
        console.error("[AdminPageLayout] Error uploading profile photo to storage:", JSON.stringify(uploadError, null, 2));
        toast({ title: "Upload Error", description: `Failed to upload photo: ${uploadError.message}`, variant: "destructive" });
        setIsUploadingPhoto(false); return;
      }
      const { data: publicUrlData } = supabase.storage.from('admin-profile-photos').getPublicUrl(fileName);
      if (!publicUrlData?.publicUrl) {
         toast({ title: "Error", description: "Failed to get public URL for new photo.", variant: "destructive" });
         setIsUploadingPhoto(false); return;
      }
      newPhotoUrlToSave = publicUrlData.publicUrl;
    }

    console.log('[AdminPageLayout] Attempting to update admin_profile with photo URL:', newPhotoUrlToSave, 'for ID:', ADMIN_PROFILE_ID);
    console.log('[AdminPageLayout] Current user for DB update:', currentUserForUpdate?.email, 'User ID:', currentUserForUpdate?.id);
    const { error: dbError } = await supabase
      .from('admin_profile')
      .update({ profile_photo_url: newPhotoUrlToSave, updated_at: new Date().toISOString() })
      .eq('id', ADMIN_PROFILE_ID);
    console.log('[AdminPageLayout] DB update result - error:', dbError ? JSON.stringify(dbError, null, 2) : 'null');

    if (dbError) {
      toast({ title: "Database Error", description: `Failed to save profile photo URL: ${dbError.message}`, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Profile photo updated." });
      setProfilePhotoUrl(newPhotoUrlToSave);
      setCurrentDbProfilePhotoUrl(newPhotoUrlToSave);
      setProfilePhotoPreview(newPhotoUrlToSave);
      if (oldImageStoragePathToDelete && newPhotoUrlToSave !== currentDbProfilePhotoUrl) {
          const { error: storageDeleteError } = await supabase.storage.from('admin-profile-photos').remove([oldImageStoragePathToDelete]);
           if (storageDeleteError) console.warn("[AdminPageLayout] Failed to delete old profile photo from storage:", JSON.stringify(storageDeleteError, null, 2));
      }
      await supabase.from('admin_activity_log').insert({ action_type: 'PROFILE_PHOTO_UPDATED', description: `Admin profile photo updated by ${currentUserForUpdate.email}.`, user_identifier: currentUserForUpdate.id });
    }
    setProfilePhotoFile(null);
    setIsUploadingPhoto(false);
    setIsPhotoModalOpen(false); // Close modal on successful save
  };

  const handleDeleteProfilePhoto = async () => {
    if (!currentDbProfilePhotoUrl) {
      toast({ title: "No Photo", description: "No profile photo to delete.", variant: "default" });
      return;
    }
    setIsUploadingPhoto(true);
    const {data: { user: currentUserForDelete } } = await supabase.auth.getUser();
     if (!currentUserForDelete) {
        toast({ title: "Auth Error", description: "Please log in again to remove profile photo.", variant: "destructive"});
        setIsUploadingPhoto(false); return;
    }

    let imageStoragePathToDelete: string | null = null;
    try {
        const url = new URL(currentDbProfilePhotoUrl);
        const pathParts = url.pathname.split('/admin-profile-photos/');
        if (pathParts.length > 1 && !pathParts[1].startsWith('http')) imageStoragePathToDelete = decodeURIComponent(pathParts[1]);
    } catch(e) { console.warn("[AdminPageLayout] Could not parse currentDbProfilePhotoUrl for deletion (during explicit delete):", currentDbProfilePhotoUrl, e); }

    if (imageStoragePathToDelete) {
      const { error: storageError } = await supabase.storage.from('admin-profile-photos').remove([imageStoragePathToDelete]);
      if (storageError) console.warn("[AdminPageLayout] Error deleting profile photo from storage:", JSON.stringify(storageError, null, 2));
    }

    const { error: dbError } = await supabase
      .from('admin_profile')
      .update({ profile_photo_url: null, updated_at: new Date().toISOString() })
      .eq('id', ADMIN_PROFILE_ID);

    if (dbError) {
      toast({ title: "Database Error", description: `Failed to remove profile photo URL: ${dbError.message}`, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Profile photo removed." });
      setProfilePhotoUrl(null); setCurrentDbProfilePhotoUrl(null); setProfilePhotoPreview(null);
      await supabase.from('admin_activity_log').insert({ action_type: 'PROFILE_PHOTO_REMOVED', description: `Admin profile photo removed by ${currentUserForDelete.email}.`, user_identifier: currentUserForDelete.id });
    }
    setProfilePhotoFile(null);
    setIsUploadingPhoto(false);
  };

  const handleChangePassword = async () => {
    setPasswordChangeError('');
    if (newPassword.length < 6) {
      setPasswordChangeError("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordChangeError("New passwords do not match.");
      return;
    }
    setIsChangingPassword(true);
    const { data: { user: currentUserForPasswordChange } } = await supabase.auth.getUser();
     if (!currentUserForPasswordChange) {
        toast({ title: "Auth Error", description: "Please log in again to change password.", variant: "destructive"});
        setIsChangingPassword(false); return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPasswordChangeError(`Failed to change password: ${error.message}`);
      toast({ title: "Password Change Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Password changed successfully. You may be logged out." });
      setNewPassword(''); setConfirmPassword('');
      await supabase.from('admin_activity_log').insert({ action_type: 'ADMIN_PASSWORD_CHANGED', description: `Admin password changed by ${currentUserForPasswordChange.email}.`, user_identifier: currentUserForPasswordChange.id });
      setIsPasswordModalOpen(false); 
    }
    setIsChangingPassword(false);
  };

  const handleOpenPhotoModal = () => {
    fetchAdminProfile(); 
    setProfilePhotoFile(null); 
    setIsPhotoModalOpen(true);
  };

  const handleOpenPasswordModal = () => {
    setNewPassword('');
    setConfirmPassword('');
    setPasswordChangeError('');
    setIsPasswordModalOpen(true);
  };

  return (
    <>
    <div className={cn("flex h-screen", isMobileMenuOpen ? "" : "bg-sidebar text-sidebar-foreground")}>
      <aside className={cn(
        "hidden md:flex md:flex-shrink-0 transition-all duration-300 ease-in-out",
        isSidebarCollapsed ? "w-20" : "w-64"
      )}>
         <SidebarContent
            isMobile={false}
            isCollapsed={isSidebarCollapsed}
            navItems={navItems}
            activeSection={activeSection}
            onSelectSection={onSelectSection}
            toggleSidebarCollapse={toggleSidebarCollapse}
            onCloseMobileSheet={() => setIsMobileMenuOpen(false)}
         />
      </aside>

       <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetTrigger asChild className="md:hidden fixed top-4 left-4 z-50">
          <Button variant="outline" size="icon">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72 bg-sidebar border-r border-sidebar-border">
          <SheetHeader className="p-4 border-b border-sidebar-border">
            <SheetPrimitiveTitle className="text-sidebar-foreground">Admin Menu</SheetPrimitiveTitle>
          </SheetHeader>
          <SidebarContent
            isMobile
            isCollapsed={false}
            navItems={navItems}
            activeSection={activeSection}
            onSelectSection={onSelectSection}
            onCloseMobileSheet={() => setIsMobileMenuOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <div className={cn(
        "flex flex-col flex-1 overflow-hidden transition-all duration-300 ease-in-out min-w-0",
        "bg-background text-foreground" 
      )}>
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-card px-4 md:px-6 shrink-0">
          <div className="md:hidden"> {/* Placeholder for mobile menu trigger if needed here */} </div>
          <h1 className="text-xl font-semibold text-foreground">{pageTitle}</h1>
          <div className="flex items-center gap-3">
            <Sheet open={isActivitySheetOpen} onOpenChange={setIsActivitySheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="View Recent Activity" className="hover:text-primary">
                  <BellIcon className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[350px] sm:w-[400px] p-0 flex flex-col">
                <SheetHeader className="p-4 border-b">
                  <SheetPrimitiveTitle className="flex items-center"><History className="mr-2 h-5 w-5"/>Recent Activity</SheetPrimitiveTitle>
                  <SheetDescription>Latest updates and actions in the admin panel.</SheetDescription>
                </SheetHeader>
                <ScrollArea className="flex-grow p-4">
                  {isLoadingActivities ? (
                    <p className="text-muted-foreground text-center py-4">Loading activities...</p>
                  ) : activities.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No recent activity.</p>
                  ) : (
                    <ul className="space-y-3">
                      {activities.map((activity) => (
                        <li key={activity.id} className="text-sm border-b pb-2 mb-2 last:border-b-0 last:pb-0 last:mb-0">
                          <p className="font-medium text-foreground">{activity.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {isValidDate(parseISO(activity.timestamp)) ? format(parseISO(activity.timestamp), "MMM d, yyyy 'at' h:mm a") : "Invalid Date"}
                            {' by '}
                            <span className="font-medium">{activity.user_identifier?.includes('@') ? activity.user_identifier.split('@')[0] : activity.user_identifier || 'System'}</span>
                          </p>
                          {activity.details && (<pre className="mt-1 text-xs bg-muted p-2 rounded-md overflow-x-auto">{JSON.stringify(activity.details, null, 2)}</pre>)}
                        </li>
                      ))}
                    </ul>
                  )}
                </ScrollArea>
                {activities.length > 0 && !isLoadingActivities && (
                  <SheetFooter className="p-4 border-t">
                    <Button variant="outline" size="sm" onClick={() => setShowClearLogConfirm(true)} disabled={isLoadingActivities}>
                      <Trash2 className="mr-2 h-4 w-4"/> Clear Log
                    </Button>
                  </SheetFooter>
                )}
              </SheetContent>
            </Sheet>

            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme" className="hover:text-primary" disabled={!headerIsMounted}>
              {currentThemeIcon}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profilePhotoUrl || undefined} alt={username || "Admin"} className="object-cover" />
                    <AvatarFallback>{getUserInitials(username)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none break-all">{username || "Admin"}</p>
                    <p className="text-xs leading-none text-muted-foreground">Administrator</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleOpenPhotoModal}>
                  <ImageIcon className="mr-2 h-4 w-4" />
                  <span>Change Profile Picture</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleOpenPasswordModal}>
                  <KeyRound className="mr-2 h-4 w-4" />
                  <span>Change Password</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout}>
                  <LogoutIcon className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className={cn("flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 min-w-0", "bg-background text-foreground")}>
          {children}
        </main>
      </div>
    </div>

    {/* Profile Photo Management Modal */}
    <Dialog open={isPhotoModalOpen} onOpenChange={setIsPhotoModalOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogPrimitiveHeader>
                <DialogPrimitiveDialogTitle>Change Profile Picture</DialogPrimitiveDialogTitle>
                <DialogDescription>
                    Upload a new photo or remove the current one.
                </DialogDescription>
            </DialogPrimitiveHeader>
            <ScrollArea className="max-h-[70vh] p-1 pr-2">
              <div className="grid gap-6 py-4 px-2">
                  <div className="space-y-2">
                      <Label htmlFor="profile_photo_file">New Profile Photo</Label>
                      <div className="flex items-center gap-3">
                          <Input id="profile_photo_file" type="file" accept="image/*" onChange={handleProfilePhotoFileChange} className="flex-grow" key={profilePhotoFile ? 'file-selected' : 'no-file'} />
                          <UploadCloud className="h-6 w-6 text-muted-foreground"/>
                      </div>
                  </div>
                  {profilePhotoPreview ? (
                      <div className="mt-2 p-2 border rounded-md bg-muted aspect-square relative w-32 h-32 mx-auto overflow-hidden rounded-full">
                          <NextImage src={profilePhotoPreview} alt="Profile photo preview" fill className="object-cover" sizes="128px" />
                      </div>
                  ) : (
                       <div className="mt-2 p-2 border rounded-full bg-muted w-32 h-32 mx-auto flex items-center justify-center">
                          <UserCircle className="h-16 w-16 text-muted-foreground" />
                      </div>
                  )}
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <Button type="button" onClick={handleSaveProfilePhoto} disabled={isUploadingPhoto || (!profilePhotoFile && profilePhotoPreview === currentDbProfilePhotoUrl)} size="sm">
                          {isUploadingPhoto && profilePhotoFile ? <><UploadCloud className="mr-2 h-4 w-4 animate-pulse"/>Saving...</> : <><UploadCloud className="mr-2 h-4 w-4"/>Save Photo</>}
                      </Button>
                      {currentDbProfilePhotoUrl && (
                          <Button type="button" variant="destructive" onClick={handleDeleteProfilePhoto} disabled={isUploadingPhoto} size="sm">
                              {isUploadingPhoto && !profilePhotoFile ? "Removing..." : <><Trash2 className="mr-2 h-4 w-4"/>Remove Photo</>}
                          </Button>
                      )}
                  </div>
              </div>
            </ScrollArea>
            <DialogFooter className="pt-4 border-t"> <DialogClose asChild> <Button type="button" variant="outline">Close</Button> </DialogClose> </DialogFooter>
        </DialogContent>
    </Dialog>

    {/* Change Password Modal */}
    <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogPrimitiveHeader>
          <DialogPrimitiveDialogTitle>Change Password</DialogPrimitiveDialogTitle>
          <DialogDescription>Enter and confirm your new password.</DialogDescription>
        </DialogPrimitiveHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password (min. 6 characters)" className={passwordChangeError ? "border-destructive" : ""} />
          </div>
          <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" className={passwordChangeError ? "border-destructive" : ""} />
          </div>
          {passwordChangeError && <p className="text-sm text-destructive">{passwordChangeError}</p>}
        </div>
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
          <Button type="button" onClick={handleChangePassword} disabled={isChangingPassword}>
              {isChangingPassword ? <KeyRound className="mr-2 h-4 w-4 animate-spin"/> : <KeyRound className="mr-2 h-4 w-4"/>}
              Change Password
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Clear Activity Log Confirmation Dialog */}
    <AlertDialog open={showClearLogConfirm} onOpenChange={setShowClearLogConfirm}>
      <AlertDialogContent className="bg-destructive border-destructive text-destructive-foreground">
        <AlertDialogPrimitiveHeader>
          <AlertDialogPrimitiveAlertDialogTitle className="text-destructive-foreground">Clear Entire Activity Log?</AlertDialogPrimitiveAlertDialogTitle>
          <AlertDialogDescription className="text-destructive-foreground/90">
            This action cannot be undone. All activity log entries will be permanently deleted.
          </AlertDialogDescription>
        </AlertDialogPrimitiveHeader>
        <AlertDialogPrimitiveFooter>
          <AlertDialogCancel onClick={() => setShowClearLogConfirm(false)} className={cn(buttonVariants({ variant: "outline" }), "border-destructive-foreground/40 text-destructive-foreground", "hover:bg-destructive-foreground/10 hover:text-destructive-foreground hover:border-destructive-foreground/60")}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleClearActivityLog} disabled={isLoadingActivities} className={cn(buttonVariants({ variant: "default" }), "bg-destructive-foreground text-destructive", "hover:bg-destructive-foreground/90")}>
            {isLoadingActivities ? "Clearing..." : "Clear Log"}
          </AlertDialogAction>
        </AlertDialogPrimitiveFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
    