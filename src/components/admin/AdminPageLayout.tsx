
"use client";

import Link from 'next/link';
import NextImage from 'next/image'; // Renamed to avoid conflict with potential future 'Image' variables
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  Menu, X, Sun, Moon, 
  LogOut as LogoutIcon, LayoutDashboard, Bell as BellIcon, UserCircle, Settings, UploadCloud, Trash2
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeProvider';
import { cn } from '@/lib/utils';
import React, { useState, useEffect, type ChangeEvent } from 'react';
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/lib/supabaseClient';
import type { AdminProfile } from '@/types/supabase';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ADMIN_PROFILE_ID = '00000000-0000-0000-0000-00000000000A'; // Fixed ID for single admin profile

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
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [currentDbProfilePhotoUrl, setCurrentDbProfilePhotoUrl] = useState<string | null>(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);


  const fetchAdminProfile = async () => {
    const { data, error } = await supabase
      .from('admin_profile')
      .select('profile_photo_url')
      .eq('id', ADMIN_PROFILE_ID)
      .maybeSingle();

    if (error) {
      console.error("Error fetching admin profile photo:", error);
      toast({ title: "Error", description: "Could not fetch profile photo.", variant: "destructive" });
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

  useEffect(() => {
    setMounted(true);
    fetchAdminProfile();
  }, []);

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


  if (!mounted) return null; 

  let effectiveTheme = theme;
  if (theme === 'system' && typeof window !== 'undefined') {
    effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  const toggleTheme = () => setTheme(effectiveTheme === 'dark' ? 'light' : 'dark');

  const getUserInitials = (name: string) => {
    if (!name) return "A"; 
    const parts = name.split(/[\s@.]+/); 
    if (parts.length > 0 && parts[0]) {
        if (parts.length > 1 && parts[1]) {
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
    let newPhotoUrlToSave: string | null = currentDbProfilePhotoUrl; // Keep existing if no new file

    // 1. If a new file is selected, upload it
    if (profilePhotoFile) {
      const fileExt = profilePhotoFile.name.split('.').pop();
      const fileName = `admin_avatar_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`; // Path in the bucket

      toast({ title: "Uploading Profile Photo", description: "Please wait..." });
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('admin-profile-photos')
        .upload(filePath, profilePhotoFile, { cacheControl: '3600', upsert: true }); // upsert true to overwrite if same name

      if (uploadError) {
        toast({ title: "Upload Error", description: `Failed to upload photo: ${uploadError.message}`, variant: "destructive" });
        setIsUploadingPhoto(false);
        return;
      }
      const { data: publicUrlData } = supabase.storage.from('admin-profile-photos').getPublicUrl(filePath);
      newPhotoUrlToSave = publicUrlData?.publicUrl || null;

      // If there was an old photo and we uploaded a new one, delete the old one from storage
      if (currentDbProfilePhotoUrl && currentDbProfilePhotoUrl !== newPhotoUrlToSave) {
        const oldPathParts = currentDbProfilePhotoUrl.split('/admin-profile-photos/');
        if (oldPathParts.length > 1 && !oldPathParts[1].startsWith('http')) {
            const { error: deleteStorageError } = await supabase.storage.from('admin-profile-photos').remove([oldPathParts[1]]);
            if (deleteStorageError) console.warn("Error deleting old profile photo from storage:", deleteStorageError);
        }
      }
    }

    // 2. Update the database
    const { error: dbError } = await supabase
      .from('admin_profile')
      .update({ profile_photo_url: newPhotoUrlToSave, updated_at: new Date().toISOString() })
      .eq('id', ADMIN_PROFILE_ID);

    if (dbError) {
      toast({ title: "Database Error", description: `Failed to save profile photo URL: ${dbError.message}`, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Profile photo updated." });
      setProfilePhotoUrl(newPhotoUrlToSave); // Update UI immediately
      setCurrentDbProfilePhotoUrl(newPhotoUrlToSave);
      setProfilePhotoFile(null); // Clear file input
      setIsPhotoModalOpen(false);
    }
    setIsUploadingPhoto(false);
  };

  const handleDeleteProfilePhoto = async () => {
    if (!currentDbProfilePhotoUrl) {
        toast({ title: "No Photo", description: "There is no profile photo to delete.", variant: "default" });
        return;
    }
    setIsUploadingPhoto(true); // Use same loading state

    // 1. Delete from Storage
    const pathParts = currentDbProfilePhotoUrl.split('/admin-profile-photos/');
    if (pathParts.length > 1 && !pathParts[1].startsWith('http')) {
        const { error: deleteStorageError } = await supabase.storage.from('admin-profile-photos').remove([pathParts[1]]);
        if (deleteStorageError) {
            toast({ title: "Storage Error", description: `Failed to delete photo from storage: ${deleteStorageError.message}. Please try saving an empty URL.`, variant: "destructive" });
            setIsUploadingPhoto(false);
            return;
        }
    } else {
        console.warn("Could not parse storage path for deletion:", currentDbProfilePhotoUrl);
    }
    
    // 2. Update database to remove URL
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
        >
          <Settings className="mr-3 h-5 w-5" />
          Settings
        </Button>
      </div>
    </div>
  );


  return (
    <>
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
            <Button variant="ghost" size="icon" onClick={() => alert("Notifications clicked - functionality to be implemented.")} aria-label="Notifications" className="hover:text-primary">
              <BellIcon className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme" className="hover:text-primary">
              {effectiveTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profilePhotoUrl || undefined} alt={username} />
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
                <DropdownMenuItem onClick={() => setIsPhotoModalOpen(true)}>
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

    {/* Modal for Managing Profile Photo */}
    <Dialog open={isPhotoModalOpen} onOpenChange={setIsPhotoModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
                <DialogTitle>Manage Profile Photo</DialogTitle>
                <DialogDescription>
                    Upload a new photo or remove the current one.
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
                    <div className="mt-2 p-2 border rounded-md bg-muted aspect-square relative w-40 h-40 mx-auto">
                        <NextImage
                            src={profilePhotoPreview}
                            alt="Profile photo preview"
                            fill
                            className="rounded-full object-cover"
                            sizes="160px"
                        />
                    </div>
                )}
                 {!profilePhotoPreview && !profilePhotoFile && (
                    <div className="mt-2 p-2 border rounded-full bg-muted aspect-square relative w-40 h-40 mx-auto flex items-center justify-center">
                        <UserCircle className="h-20 w-20 text-muted-foreground" />
                    </div>
                )}
            </div>
            <DialogFooter className="sm:justify-between gap-2">
                {currentDbProfilePhotoUrl && (
                     <Button type="button" variant="destructive" onClick={handleDeleteProfilePhoto} disabled={isUploadingPhoto}>
                        <Trash2 className="mr-2 h-4 w-4" /> Remove Current Photo
                    </Button>
                )}
                {!currentDbProfilePhotoUrl && <div />} {/* Spacer */}
                <div className="flex gap-2">
                    <DialogClose asChild>
                        <Button type="button" variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button type="button" onClick={handleSaveProfilePhoto} disabled={isUploadingPhoto || !profilePhotoFile}>
                        {isUploadingPhoto ? "Saving..." : "Save Photo"}
                    </Button>
                </div>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
