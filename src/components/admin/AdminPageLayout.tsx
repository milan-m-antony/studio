
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
  AlertDialogFooter,
  AlertDialogHeader as AlertDialogPrimitiveHeader,
  AlertDialogTitle as AlertDialogPrimitiveTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/lib/supabaseClient';
import type { AdminActivityLog, AdminProfile } from '@/types/supabase';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Menu, X, Sun, Moon,
  LogOut as LogoutIcon, Bell as BellIcon, UserCircle, Settings as SettingsIcon,
  UploadCloud, Trash2, History, ChevronRight, ChevronLeft, KeyRound
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

interface AdminPageLayoutProps {
  navItems: AdminNavItem[];
  activeSection: string;
  onSelectSection: (sectionKey: string) => void;
  onLogout: () => Promise<void>;
  username: string | null;
  children: React.ReactNode;
  pageTitle: string;
}

const SidebarContent = ({
  isMobile = false,
  isCollapsed = false,
  navItems,
  activeSection,
  onSelectSection,
  onCloseMobileSheet,
  toggleSidebarCollapse,
}: {
  isMobile?: boolean,
  isCollapsed?: boolean,
  navItems: AdminNavItem[],
  activeSection: string,
  onSelectSection: (sectionKey: string) => void,
  onCloseMobileSheet?: () => void;
  toggleSidebarCollapse?: () => void
}) => (
    <div className={cn("flex flex-col h-full bg-sidebar text-sidebar-foreground", isMobile ? "w-full" : "")}>
      <div className={cn(
        "border-b border-sidebar-border flex items-center h-16 shrink-0", // Added shrink-0
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
          isCollapsed && !isMobile ? "px-2 py-2 flex flex-col items-center" : "p-2"
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
          "mt-auto border-t border-sidebar-border shrink-0", // Added shrink-0
          isCollapsed && !isMobile ? "px-2 py-2 flex flex-col items-center" : "p-2"
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
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false); // Renamed from isPhotoModalOpen
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // State for password change
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordChangeError, setPasswordChangeError] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);


  const fetchAdminProfile = async () => {
    console.log("[AdminPageLayout] Fetching admin profile...");
    const { data, error } = await supabase
      .from('admin_profile')
      .select('profile_photo_url')
      .eq('id', ADMIN_PROFILE_ID)
      .maybeSingle();

    if (error) {
      console.error("[AdminPageLayout] Error fetching admin profile:", error);
      toast({ title: "Profile Error", description: "Could not load profile photo.", variant: "destructive" });
    } else if (data && data.profile_photo_url) {
      console.log("[AdminPageLayout] Profile photo URL fetched:", data.profile_photo_url);
      setProfilePhotoUrl(data.profile_photo_url);
      setCurrentDbProfilePhotoUrl(data.profile_photo_url);
      setProfilePhotoPreview(data.profile_photo_url);
    } else {
      console.log("[AdminPageLayout] No profile photo URL found or it's null.");
      setProfilePhotoUrl(null);
      setCurrentDbProfilePhotoUrl(null);
      setProfilePhotoPreview(null);
    }
  };

  useEffect(() => {
    setHeaderIsMounted(true);
    fetchAdminProfile();
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState) {
      setIsSidebarCollapsed(JSON.parse(savedState));
    }
  }, []);

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
    if (!user) {
        setIsLoadingActivities(false); return;
    }
    const { data, error } = await supabase
      .from('admin_activity_log')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(50);

    if (error) {
      console.error("[AdminPageLayout] Error fetching admin activities:", error);
      toast({ title: "Error", description: "Could not fetch recent activities.", variant: "destructive" });
      setActivities([]);
    } else {
      setActivities(data || []);
    }
    setIsLoadingActivities(false);
  };

  useEffect(() => {
    if (isActivitySheetOpen) {
      fetchActivities();
    }
  }, [isActivitySheetOpen]);

  const handleClearActivityLog = async () => {
    setIsLoadingActivities(true);
    const {data: { user } } = await supabase.auth.getUser();
    if (!user) {
        toast({ title: "Authentication Error", description: "You must be logged in to clear logs.", variant: "destructive" });
        setIsLoadingActivities(false);
        return;
    }

    const { error } = await supabase
      .from('admin_activity_log')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
      console.error("[AdminPageLayout] Error clearing activity log:", error);
      toast({ title: "Error", description: "Failed to clear activity log.", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Activity log cleared." });
      setActivities([]);
      try {
        await supabase.from('admin_activity_log').insert({
          action_type: 'ACTIVITY_LOG_CLEARED',
          description: `Admin ${user.email || user.id} cleared the activity log.`,
          user_identifier: user.id
        });
      } catch (logError) {
        console.error("[AdminPageLayout] Error logging activity log clear:", logError);
      }
    }
    setShowClearLogConfirm(false);
    setIsLoadingActivities(false);
  };

  const getUserInitials = (name: string | null) => {
    if (!name) return "AD";
    if (name.includes('@')) {
      const emailPrefix = name.split('@')[0];
      if (emailPrefix.length >= 2) return emailPrefix.substring(0, 2).toUpperCase();
      if (emailPrefix.length === 1) return emailPrefix.toUpperCase() + "X";
      return "AD";
    }
    const parts = name.split(/[\s_]+/);
    if (parts.length > 0 && parts[0]) {
        if (parts.length > 1 && parts[1] && parts[1].length > 0) {
             return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        }
        return parts[0].substring(0, 2).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleProfilePhotoFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setProfilePhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhotoPreview(reader.result as string);
      };
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
        setIsUploadingPhoto(false);
        return;
    }

    let oldImageStoragePathToDelete: string | null = null;
    if (currentDbProfilePhotoUrl) {
        try {
            const url = new URL(currentDbProfilePhotoUrl);
            const pathParts = url.pathname.split('/admin-profile-photos/');
            if (pathParts.length > 1 && !pathParts[1].startsWith('http')) {
                oldImageStoragePathToDelete = pathParts[1];
            }
        } catch(e) { console.warn("[AdminPageLayout] Could not parse currentDbProfilePhotoUrl for deletion:", currentDbProfilePhotoUrl, e); }
    }

    if (profilePhotoFile) {
      const fileExt = profilePhotoFile.name.split('.').pop();
      const fileName = `admin_profile_${currentUserForUpdate.id}_${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('admin-profile-photos')
        .upload(fileName, profilePhotoFile, { cacheControl: '3600', upsert: false });

      if (uploadError) {
        console.error("[AdminPageLayout] Error uploading profile photo to storage:", JSON.stringify(uploadError, null, 2));
        toast({ title: "Upload Error", description: `Failed to upload photo: ${uploadError.message}`, variant: "destructive" });
        setIsUploadingPhoto(false);
        return;
      }
      const { data: publicUrlData } = supabase.storage.from('admin-profile-photos').getPublicUrl(fileName);
      if (!publicUrlData?.publicUrl) {
         toast({ title: "Error", description: "Failed to get public URL for new photo.", variant: "destructive" });
         setIsUploadingPhoto(false);
         return;
      }
      newPhotoUrlToSave = publicUrlData.publicUrl;
    }

    const { error: dbError } = await supabase
      .from('admin_profile')
      .update({ profile_photo_url: newPhotoUrlToSave, updated_at: new Date().toISOString() })
      .eq('id', ADMIN_PROFILE_ID);

    if (dbError) {
      toast({ title: "Database Error", description: `Failed to save profile photo URL: ${dbError.message}`, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Profile photo updated." });
      setProfilePhotoUrl(newPhotoUrlToSave);
      setCurrentDbProfilePhotoUrl(newPhotoUrlToSave);
      setProfilePhotoPreview(newPhotoUrlToSave);

      if (oldImageStoragePathToDelete && newPhotoUrlToSave !== currentDbProfilePhotoUrl) {
          console.log("[AdminPageLayout] Attempting to delete old profile photo from storage:", oldImageStoragePathToDelete);
          await supabase.storage.from('admin-profile-photos').remove([oldImageStoragePathToDelete]);
      }

      await supabase.from('admin_activity_log').insert({
            action_type: 'PROFILE_PHOTO_UPDATED',
            description: `Admin profile photo updated by ${currentUserForUpdate.email}.`,
            user_identifier: currentUserForUpdate.id
      });
    }
    setProfilePhotoFile(null);
    setIsUploadingPhoto(false);
    // setIsProfileModalOpen(false); // Optional: close modal on save
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
        setIsUploadingPhoto(false);
        return;
    }

    try {
        const url = new URL(currentDbProfilePhotoUrl);
        const pathParts = url.pathname.split('/admin-profile-photos/');
        if (pathParts.length > 1 && !pathParts[1].startsWith('http')) {
            const storagePath = pathParts[1];
            await supabase.storage.from('admin-profile-photos').remove([storagePath]);
        }
    } catch(e) { console.warn("[AdminPageLayout] Could not parse/delete from storage (during explicit delete):", currentDbProfilePhotoUrl, e); }

    const { error: dbError } = await supabase
      .from('admin_profile')
      .update({ profile_photo_url: null, updated_at: new Date().toISOString() })
      .eq('id', ADMIN_PROFILE_ID);

    if (dbError) {
      toast({ title: "Database Error", description: `Failed to remove profile photo URL: ${dbError.message}`, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Profile photo removed." });
      setProfilePhotoUrl(null);
      setCurrentDbProfilePhotoUrl(null);
      setProfilePhotoPreview(null);
      await supabase.from('admin_activity_log').insert({
            action_type: 'PROFILE_PHOTO_REMOVED',
            description: `Admin profile photo removed by ${currentUserForDelete.email}.`,
            user_identifier: currentUserForDelete.id
      });
    }
    setProfilePhotoFile(null);
    setIsUploadingPhoto(false);
    // setIsProfileModalOpen(false); // Optional: close modal
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
        setIsChangingPassword(false);
        return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      console.error("[AdminPageLayout] Error changing password:", error);
      setPasswordChangeError(`Failed to change password: ${error.message}`);
      toast({ title: "Password Change Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Password changed successfully." });
      setNewPassword('');
      setConfirmPassword('');
      await supabase.from('admin_activity_log').insert({
        action_type: 'ADMIN_PASSWORD_CHANGED',
        description: `Admin password changed by ${currentUserForPasswordChange.email}.`,
        user_identifier: currentUserForPasswordChange.id
      });
      // setIsProfileModalOpen(false); // Optionally close modal
    }
    setIsChangingPassword(false);
  };

  const handleOpenProfileModal = () => {
    setProfilePhotoFile(null); // Clear any stale file selection
    setProfilePhotoPreview(currentDbProfilePhotoUrl); // Reset preview to current DB photo
    setNewPassword('');
    setConfirmPassword('');
    setPasswordChangeError('');
    setIsProfileModalOpen(true);
  }


  return (
    <>
    <div className="flex h-screen bg-sidebar text-sidebar-foreground">
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
          <div className="md:hidden">
            {/* Mobile menu trigger handled by SheetTrigger outside */}
          </div>
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
                          {activity.details && (
                            <pre className="mt-1 text-xs bg-muted p-2 rounded-md overflow-x-auto">
                              {JSON.stringify(activity.details, null, 2)}
                            </pre>
                          )}
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
                    <p className="text-sm font-medium leading-none">{username || "Admin"}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      Administrator
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleOpenProfileModal}>
                  <UserCircle className="mr-2 h-4 w-4" />
                  <span>Manage Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onLogout}>
                  <LogoutIcon className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-background min-w-0">
          {children}
        </main>
      </div>
    </div>

    <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogPrimitiveHeader>
                <DialogPrimitiveDialogTitle>Manage Profile</DialogPrimitiveDialogTitle>
                <DialogDescription>
                    Update your profile photo, view account information, and change your password.
                </DialogDescription>
            </DialogPrimitiveHeader>
            
            <ScrollArea className="max-h-[70vh] p-1 pr-2">
              <div className="grid gap-6 py-4 px-2">
                  {/* Profile Photo Section */}
                  <div className="space-y-4">
                      <h3 className="text-lg font-medium text-foreground border-b pb-2">Profile Photo</h3>
                      <div className="space-y-2">
                          <Label htmlFor="profile_photo_file">New Profile Photo</Label>
                          <div className="flex items-center gap-3">
                              <Input
                                  id="profile_photo_file"
                                  type="file"
                                  accept="image/*"
                                  onChange={handleProfilePhotoFileChange}
                                  className="flex-grow"
                                  key={profilePhotoFile ? 'file-selected' : 'no-file'}
                              />
                              <UploadCloud className="h-6 w-6 text-muted-foreground"/>
                          </div>
                      </div>
                      {profilePhotoPreview ? (
                          <div className="mt-2 p-2 border rounded-md bg-muted aspect-square relative w-32 h-32 mx-auto overflow-hidden rounded-full">
                              <NextImage
                                  src={profilePhotoPreview}
                                  alt="Profile photo preview"
                                  fill
                                  className="object-cover"
                                  sizes="128px"
                              />
                          </div>
                      ) : (
                           <div className="mt-2 p-2 border rounded-full bg-muted w-32 h-32 mx-auto flex items-center justify-center">
                              <UserCircle className="h-16 w-16 text-muted-foreground" />
                          </div>
                      )}
                      <div className="flex flex-col sm:flex-row gap-2 justify-center">
                          <Button type="button" onClick={handleSaveProfilePhoto} disabled={isUploadingPhoto || (!profilePhotoFile && profilePhotoPreview === currentDbProfilePhotoUrl)} size="sm">
                              {isUploadingPhoto && profilePhotoFile ? <><UploadCloud className="mr-2 h-4 w-4 animate-pulse"/>Saving Photo...</> :  <><UploadCloud className="mr-2 h-4 w-4"/>Save Photo</>}
                          </Button>
                          {currentDbProfilePhotoUrl && (
                              <Button type="button" variant="destructive" onClick={handleDeleteProfilePhoto} disabled={isUploadingPhoto} size="sm">
                                  {isUploadingPhoto && !profilePhotoFile ? "Removing..." : <><Trash2 className="mr-2 h-4 w-4"/>Remove Photo</>}
                              </Button>
                          )}
                      </div>
                  </div>

                  <Separator className="my-4" />

                  {/* Account Information Section */}
                  <div className="space-y-3">
                      <h3 className="text-lg font-medium text-foreground border-b pb-2">Account Information</h3>
                      <div>
                          <Label className="text-xs text-muted-foreground">Username/Email</Label>
                          <p className="text-sm text-foreground break-all">{username || "N/A"}</p>
                      </div>
                  </div>

                  <Separator className="my-4" />

                  {/* Change Password Section */}
                  <div className="space-y-4">
                      <h3 className="text-lg font-medium text-foreground border-b pb-2">Change Password</h3>
                      <div className="space-y-2">
                          <Label htmlFor="newPassword">New Password</Label>
                          <Input
                              id="newPassword"
                              type="password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="Enter new password (min. 6 characters)"
                          />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="confirmPassword">Confirm New Password</Label>
                          <Input
                              id="confirmPassword"
                              type="password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="Confirm new password"
                          />
                      </div>
                      {passwordChangeError && <p className="text-sm text-destructive">{passwordChangeError}</p>}
                      <Button type="button" onClick={handleChangePassword} disabled={isChangingPassword} className="w-full sm:w-auto">
                          {isChangingPassword ? <KeyRound className="mr-2 h-4 w-4 animate-spin"/> : <KeyRound className="mr-2 h-4 w-4"/>}
                          Change Password
                      </Button>
                  </div>
              </div>
            </ScrollArea>
            <DialogFooter className="pt-4 border-t">
                <DialogClose asChild>
                    <Button type="button" variant="outline">Close</Button>
                </DialogClose>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    <AlertDialog open={showClearLogConfirm} onOpenChange={setShowClearLogConfirm}>
      <AlertDialogContent className="bg-destructive border-destructive text-destructive-foreground">
        <AlertDialogPrimitiveHeader>
          <AlertDialogPrimitiveTitle className="text-destructive-foreground">Clear Entire Activity Log?</AlertDialogPrimitiveTitle>
          <AlertDialogDescription className="text-destructive-foreground/90">
            This action cannot be undone. All activity log entries will be permanently deleted.
          </AlertDialogDescription>
        </AlertDialogPrimitiveHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={() => setShowClearLogConfirm(false)}
            className={cn(buttonVariants({ variant: "outline" }), "border-destructive-foreground/40 text-destructive-foreground", "hover:bg-destructive-foreground/10 hover:text-destructive-foreground hover:border-destructive-foreground/60")}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleClearActivityLog}
            disabled={isLoadingActivities}
            className={cn(buttonVariants({ variant: "default" }), "bg-destructive-foreground text-destructive", "hover:bg-destructive-foreground/90")}
          >
            {isLoadingActivities ? "Clearing..." : "Clear Log"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
    

    