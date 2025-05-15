
"use client";

import React, { useEffect, useState, type FormEvent, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
// Removed SectionWrapper import as it's not used for the login form part anymore
import SectionTitle from '@/components/ui/SectionTitle';
import { Button } from '@/components/ui/button'; // Removed buttonVariants as it wasn't used
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldCheck, LogOut, AlertTriangle, LogIn, Home } from 'lucide-react';
import Link from 'next/link';
import ProjectsManager from '@/components/admin/ProjectsManager';
import SkillsManager from '@/components/admin/SkillsManager';
import AboutManager from '@/components/admin/AboutManager';
import SectionWrapper from '@/components/ui/SectionWrapper'; // Still needed for authenticated view

export default function AdminDashboardPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = React.useState(false);
  const [isAuthenticatedForRender, setIsAuthenticatedForRender] = React.useState(false);
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      const authStatus = localStorage.getItem('isAdminAuthenticated') === 'true';
      setIsAuthenticatedForRender(authStatus);
    }
  }, []);

  const handleLoginSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    const expectedUsername = process.env.NEXT_PUBLIC_ADMIN_USERNAME;
    const expectedPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

    console.log('[Admin Login] Attempting login...');
    console.log('[Admin Login] Entered Username:', `"${trimmedUsername}"`);
    console.log('[Admin Login] Expected Username from env:', `"${expectedUsername}"`);
    console.log('[Admin Login] Password match status (not logging actual passwords):', trimmedPassword === expectedPassword);


    const usernameMatch = trimmedUsername === expectedUsername;
    const passwordMatch = trimmedPassword === expectedPassword;

    console.log('[Admin Login] Username match status:', usernameMatch);
    console.log('[Admin Login] Password match status (not logging actual passwords):', passwordMatch);

    if (usernameMatch && passwordMatch) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('isAdminAuthenticated', 'true');
        window.dispatchEvent(new CustomEvent('authChange'));
      }
      setIsAuthenticatedForRender(true);
      console.log('[Admin Login] Login successful.');
    } else {
      setError("Invalid username or password.");
      setIsAuthenticatedForRender(false);
      console.log('[Admin Login] Login failed.');
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('isAdminAuthenticated');
      window.dispatchEvent(new CustomEvent('authChange'));
    }
    setIsAuthenticatedForRender(false);
    setUsername('');
    setPassword('');
  };


  if (!isMounted) {
    return ( // Keep using SectionWrapper for loading state for consistency if desired
      <SectionWrapper>
        <div className="flex justify-center items-center min-h-screen">
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </SectionWrapper>
    );
  }

  if (!isAuthenticatedForRender) {
    return (
      // Use a dedicated div for full-screen centering of the login card
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted/50 p-4">
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
             <Link href="/" className="inline-flex items-center justify-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors p-0 h-auto">
                <Home className="mr-2 h-4 w-4 inline-block" />Back to Portfolio
             </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Authenticated View (uses SectionWrapper for consistent page content layout)
  return (
    <SectionWrapper>
      <SectionTitle subtitle="Manage portfolio content.">Admin Dashboard</SectionTitle>
      <div className="flex justify-between items-center mb-8">
        <Button asChild className="mb-0">
          <Link href="/">
            <span>
                <Home className="mr-2 h-4 w-4"/>Back to Portfolio
            </span>
          </Link>
        </Button>
        <Button variant="outline" onClick={handleLogout}><LogOut className="mr-2 h-4 w-4" /> Logout</Button>
      </div>

      <div className="space-y-12">
        <ProjectsManager />
        <SkillsManager />
        <AboutManager />
      </div>
    </SectionWrapper>
  );
}
