
"use client";

import Link from 'next/link';
import NextImage from 'next/image';
import { Button, buttonVariants } from '@/components/ui/button';
import { 
  Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, 
  SheetDescription, SheetFooter 
} from '@/components/ui/sheet';
import {
  Menu, X, Sun, Moon,
  LogOut as LogoutIcon, Bell as BellIcon, UserCircle, Settings as SettingsIcon, 
  UploadCloud, Trash2, History, FileText, ChevronRight, ChevronLeft
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeProvider';
import { cn } from '@/lib/utils';
import React, { useState, useEffect, type ChangeEvent, type ReactNode, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/lib/supabaseClient';
import type { AdminProfile, AdminActivityLog } from '@/types/supabase';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, parseISO } from 'date-fns';
import * as AccordionPrimitive from "@radix-ui/react-accordion";


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
  onLogout: () => void;
  username: string;
  children: React.ReactNode;
  pageTitle: string;
}

const SidebarContent = ({ 
  isMobile = false, 
  isCollapsed = false,
  navItems,
  activeSection,
  onSelectSection,
  toggleSidebarCollapse
}: { 
  isMobile?: boolean, 
  isCollapsed?: boolean,
  navItems: AdminNavItem[],
  activeSection: string,
  onSelectSection: (sectionKey: string) => void,
  toggleSidebarCollapse?: () => void
 }) => (
    <div className={cn("flex flex-col h-full bg-sidebar text-sidebar-foreground", isMobile ? "w-full" : "")}>
      <div className={cn(
        "border-b border-sidebar-border flex items-center h-16",
        isCollapsed && !isMobile ? "px-4 justify-center" : "px-4 justify-between" // Ensure px-4 when collapsed
      )}>
        <Link
          href="/admin/dashboard"
          className={cn(
            "flex items-center", 
            isCollapsed && !isMobile ? "justify-center w-full" : ""
          )}
          onClick={() => { onSelectSection('dashboard'); if(isMobile && (AdminPageLayout as any).setIsMobileMenuOpenState) (AdminPageLayout as any).setIsMobileMenuOpenState(false);}}
          aria-label="Go to admin dashboard"
        >
          <div className={cn(
            "relative rounded-full overflow-hidden border border-sidebar-accent flex-shrink-0",
            isCollapsed && !isMobile ? "h-8 w-8" : "h-10 w-10" // Logo container size adjustment
          )}>
            <NextImage
              src="/logo.png"
              alt="Portfolio Logo"
              layout="fill"
              objectFit="contain"
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
          isCollapsed && !isMobile ? "px-4 py-2 flex flex-col" : "p-2" // px-4 when collapsed
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
                    ? "justify-center py-2.5 px-0" // Remove horizontal padding for button itself
                    : "justify-start py-2.5 px-3"
                )}
                onClick={() => {
                  onSelectSection(item.key);
                  if (isMobile && (AdminPageLayout as any).setIsMobileMenuOpenState) (AdminPageLayout as any).setIsMobileMenuOpenState(false);
                }}
                title={isCollapsed && !isMobile ? item.label : undefined} 
              >
                <Icon className={cn(
                  "h-5 w-5 flex-shrink-0",
                  isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground",
                  isCollapsed && !isMobile ? "mr-0" : "mr-2" 
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
          "mt-auto border-t border-sidebar-border",
          isCollapsed && !isMobile ? "px-4 py-2 flex flex-col" : "p-2" // px-4 when collapsed
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
                  ? "justify-center py-2.5 px-0" // Remove horizontal padding for button itself
                  : "justify-start py-2.5 px-3"
              )}
              onClick={() => {
                onSelectSection(settingsItem.key);
                if (isMobile && (AdminPageLayout as any).setIsMobileMenuOpenState) (AdminPageLayout as any).setIsMobileMenuOpenState(false);
              }}
              title={isCollapsed && !isMobile ? settingsItem.label : undefined}
            >
              <Icon className={cn(
                "h-5 w-5 flex-shrink-0",
                isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground",
                isCollapsed && !isMobile ? "mr-0" : "mr-2"
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

(AdminPageLayout as any).setIsMobileMenuOpenState = () => {};


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
  const [isMobileMenuOpenState, setIsMobileMenuOpenStateInternal] = useState(false);
  (AdminPageLayout as any).setIsMobileMenuOpenState = setIsMobileMenuOpenStateInternal;

  const [headerIsMounted, setHeaderIsMounted] = useState(false);

  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [currentDbProfilePhotoUrl, setCurrentDbProfilePhotoUrl] = useState<string | null>(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const [isActivitySheetOpen, setIsActivitySheetOpen] = useState(false);
  const [activities, setActivities] = useState<AdminActivityLog[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [showClearLogConfirm, setShowClearLogConfirm] = useState(false);
  const [CurrentThemeIcon, setCurrentThemeIcon] = useState<ReactNode>(<div className="h-5 w-5" />);
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState) {
      setIsSidebarCollapsed(JSON.parse(savedState));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  const toggleSidebarCollapse = useCallback(() => {
    setIsSidebarCollapsed(prev => !prev);
  }, []);


  const fetchAdminProfile = async () => {
    const { data, error } = await supabase
      .from('admin_profile')
      .select('profile_photo_url')
      .eq('id', ADMIN_PROFILE_ID)
      .maybeSingle();

    if (error) {
      console.error("Error fetching admin profile photo:", error);
    } else if (data && data.profile_photo_url) {
      setProfilePhotoUrl(data.profile_photo_url);
      setCurrentDbProfilePhotoUrl(data.profile_photo_url);
      setProfilePhotoPreview(data.profile_photo_url);
    } else {
      setProfilePhotoUrl(null);
      setCurrentDbProfilePhotoUrl(null);
      setProfilePhotoPreview(null);
    }
  };

  const fetchActivities = async () => {
    setIsLoadingActivities(true);
    const { data, error } = await supabase
      .from('admin_activity_log')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching admin activities:", error);
      toast({ title: "Error", description: "Could not fetch recent activities.", variant: "destructive" });
      setActivities([]);
    } else {
      setActivities(data || []);
    }
    setIsLoadingActivities(false);
  };

  const handleClearActivityLog = async () => {
    setIsLoadingActivities(true);
    const { error } = await supabase
      .from('admin_activity_log')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); 

    if (error) {
      console.error("Error clearing activity log:", error);
      toast({ title: "Error", description: "Failed to clear activity log.", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Activity log cleared." });
      setActivities([]); 
      await supabase.from('admin_activity_log').insert({
        action_type: 'ACTIVITY_LOG_CLEARED',
        description: 'Admin cleared the activity log.',
        user_identifier: username
      });
      fetchActivities(); 
    }
    setShowClearLogConfirm(false);
    setIsLoadingActivities(false);
  };


  useEffect(() => {
    setHeaderIsMounted(true);
    fetchAdminProfile();
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

  useEffect(() => {
    if (isActivitySheetOpen) { 
      fetchActivities();
    }
  }, [isActivitySheetOpen]);


  useEffect(() => {
    if (profilePhotoFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(profilePhotoFile);
    } else if (currentDbProfilePhotoUrl) { 
      setProfilePhotoPreview(currentDbProfilePhotoUrl);
    } else { 
      setProfilePhotoPreview(null);
    }
  }, [profilePhotoFile, currentDbProfilePhotoUrl]);


  const toggleTheme = () => {
    if (!headerIsMounted) return; 
    let currentEffectiveTheme = theme;
    if (theme === 'system' && typeof window !== 'undefined') {
        currentEffectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    const newThemeToSet = currentEffectiveTheme === 'dark' ? 'light' : 'dark';
    setTheme(newThemeToSet);
  };

  const getUserInitials = (name: string) => {
    if (!name) return "A";
    const parts = name.split(/[\s@.]+/); 
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
      setProfilePhotoFile(event.target.files[0]);
    } else {
      setProfilePhotoFile(null);
    }
  };

  const handleSaveProfilePhoto = async () => {
    setIsUploadingPhoto(true);
    let newPhotoUrlToSave: string | null = currentDbProfilePhotoUrl; 

    if (profilePhotoFile) {
      const fileExt = profilePhotoFile.name.split('.').pop();
      const fileName = `admin_avatar_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`; 

      toast({ title: "Uploading Profile Photo", description: "Please wait..." });
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('admin-profile-photos') 
        .upload(filePath, profilePhotoFile, { cacheControl: '3600', upsert: true }); 

      if (uploadError) {
        toast({ title: "Upload Error", description: `Failed to upload photo: ${uploadError.message}`, variant: "destructive" });
        setIsUploadingPhoto(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage.from('admin-profile-photos').getPublicUrl(filePath);
      newPhotoUrlToSave = publicUrlData?.publicUrl || null;

      if (currentDbProfilePhotoUrl && currentDbProfilePhotoUrl !== newPhotoUrlToSave) {
        const oldPathParts = currentDbProfilePhotoUrl.split('/admin-profile-photos/');
        if (oldPathParts.length > 1 && !oldPathParts[1].startsWith('http')) { 
            const { error: deleteStorageError } = await supabase.storage.from('admin-profile-photos').remove([oldPathParts[1]]);
            if (deleteStorageError) console.warn("Error deleting old profile photo from storage:", deleteStorageError);
        }
      }
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
      setProfilePhotoFile(null); 
      setIsPhotoModalOpen(false);
    }
    setIsUploadingPhoto(false);
  };

  const handleDeleteProfilePhoto = async () => {
    if (!currentDbProfilePhotoUrl) { 
        toast({ title: "No Photo", description: "There is no profile photo to delete.", variant: "default" });
        setIsPhotoModalOpen(false); 
        return;
    }
    setIsUploadingPhoto(true); 

    const pathParts = currentDbProfilePhotoUrl.split('/admin-profile-photos/');
    if (pathParts.length > 1 && !pathParts[1].startsWith('http')) {
        const { error: deleteStorageError } = await supabase.storage.from('admin-profile-photos').remove([pathParts[1]]);
        if (deleteStorageError) {
            toast({ title: "Storage Error", description: `Failed to delete photo from storage: ${deleteStorageError.message}. Please try saving to clear the URL.`, variant: "destructive" });
            setIsUploadingPhoto(false);
            return; 
        }
    }

    const { error: dbError } = await supabase
      .from('admin_profile')
      .update({ profile_photo_url: null, updated_at: new Date().toISOString() })
      .eq('id', ADMIN_PROFILE_ID);

    if (dbError) {
      toast({ title: "Database Error", description: `Failed to clear profile photo URL: ${dbError.message}`, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Profile photo removed." });
      setProfilePhotoUrl(null);
      setCurrentDbProfilePhotoUrl(null);
      setProfilePhotoPreview(null);
      setProfilePhotoFile(null);
      setIsPhotoModalOpen(false);
    }
    setIsUploadingPhoto(false);
  };
  

  return (
    <>
    <div className="flex h-screen bg-sidebar text-sidebar-foreground"> {/* Changed parent background to sidebar */}
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
         />
      </aside>

       <Sheet open={isMobileMenuOpenState} onOpenChange={setIsMobileMenuOpenStateInternal}>
        <SheetTrigger asChild className="md:hidden fixed top-4 left-4 z-50">
          <Button variant="outline" size="icon">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72 bg-sidebar border-r border-sidebar-border">
          <SidebarContent 
            isMobile 
            isCollapsed={false}
            navItems={navItems}
            activeSection={activeSection}
            onSelectSection={onSelectSection}
          />
        </SheetContent>
      </Sheet>

      <div className={cn(
        "flex flex-col flex-1 overflow-hidden transition-all duration-300 ease-in-out min-w-0",
        "bg-sidebar text-sidebar-foreground" // Apply sidebar background to main content area as well
      )}>
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-card px-4 md:px-6 shrink-0">
          <div className="md:hidden">
            {/* Spacer for mobile menu trigger, or put trigger here if preferred */}
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
                  <SheetTitle className="flex items-center"><History className="mr-2 h-5 w-5"/>Recent Activity</SheetTitle>
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
                            {format(parseISO(activity.timestamp), "MMM d, yyyy 'at' h:mm a")} by {activity.user_identifier}
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
              {CurrentThemeIcon}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profilePhotoUrl || undefined} alt={username} className="object-cover" />
                    <AvatarFallback>{getUserInitials(username)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{username}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      Administrator
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => {
                  setProfilePhotoPreview(currentDbProfilePhotoUrl); 
                  setProfilePhotoFile(null); 
                  setIsPhotoModalOpen(true);
                }}>
                  <UserCircle className="mr-2 h-4 w-4" />
                  <span>Manage Profile Photo</span>
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

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>

    <Dialog open={isPhotoModalOpen} onOpenChange={(isOpen) => {
      setIsPhotoModalOpen(isOpen);
      if (!isOpen) {
        setProfilePhotoFile(null);
        setProfilePhotoPreview(currentDbProfilePhotoUrl); 
      }
    }}>
        <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
                <DialogTitle>Manage Profile Photo</DialogTitle>
                <DialogDescription>
                    Upload a new photo or remove the current one. Image will be circular.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
                <div className="space-y-2">
                    <Label htmlFor="profile_photo_file">New Profile Photo</Label>
                    <div className="flex items-center gap-3">
                        <Input
                            id="profile_photo_file"
                            type="file"
                            accept="image/*"
                            onChange={handleProfilePhotoFileChange}
                            className="flex-grow"
                        />
                        <UploadCloud className="h-6 w-6 text-muted-foreground" />
                    </div>
                </div>

                {profilePhotoPreview && (
                    <div className="mt-2 p-2 border rounded-full bg-muted aspect-square relative w-40 h-40 mx-auto overflow-hidden">
                        <NextImage
                            src={profilePhotoPreview}
                            alt="Profile photo preview"
                            fill
                            className="object-cover" 
                            sizes="160px" 
                        />
                    </div>
                )}
                 {!profilePhotoPreview && !profilePhotoFile && ( 
                    <div className="mt-2 p-2 border rounded-full bg-muted aspect-square w-40 h-40 mx-auto flex items-center justify-center">
                        <UserCircle className="h-20 w-20 text-muted-foreground" />
                    </div>
                )}
            </div>
            <DialogFooter className="sm:justify-between gap-2 flex-col-reverse sm:flex-row">
                {currentDbProfilePhotoUrl && (
                     <Button type="button" variant="destructive" onClick={handleDeleteProfilePhoto} disabled={isUploadingPhoto}>
                        <Trash2 className="mr-2 h-4 w-4" /> Remove Current Photo
                    </Button>
                )}
                {!currentDbProfilePhotoUrl && <div className="sm:hidden" /> } 
                <div className="flex gap-2 justify-end"> 
                    <DialogClose asChild>
                        <Button type="button" variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button type="button" onClick={handleSaveProfilePhoto} disabled={isUploadingPhoto || (!profilePhotoFile && profilePhotoPreview === currentDbProfilePhotoUrl) }>
                        {isUploadingPhoto ? "Saving..." : "Save Photo"}
                    </Button>
                </div>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    <AlertDialog open={showClearLogConfirm} onOpenChange={setShowClearLogConfirm}>
      <AlertDialogContent className="bg-destructive border-destructive text-destructive-foreground">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive-foreground">Clear Entire Activity Log?</AlertDialogTitle>
          <AlertDialogDescription className="text-destructive-foreground/90">
            This action cannot be undone. All activity log entries will be permanently deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
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


    