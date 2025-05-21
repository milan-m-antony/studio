
// src/components/admin/DashboardOverview.tsx
"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, Brain, Download, Mail, Link as LinkIcon, BarChart3, Clock, TrendingUp, AlertCircle, ShoppingBag, Loader2, RefreshCw, Settings2 } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, Legend as RechartsLegend, Cell } from 'recharts';
import { supabase } from '@/lib/supabaseClient';
import { subDays, format, isValid as isValidDate, formatDistanceToNow } from 'date-fns';
import type { Project, Skill, ContactSubmission, ResumeDownload, ProjectView, SkillInteraction, SiteSettings } from '@/types/supabase';

const ADMIN_SITE_SETTINGS_ID = 'global_settings';
const AUTO_REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

interface MostViewedProjectData {
  title: string | null;
  views: number | null;
}

interface MostInteractedSkillData {
  name: string | null;
  interactions: number | null;
}

const placeholderDeviceData = [
  { name: 'Desktop', visitors: 450, color: 'hsl(var(--chart-1))' },
  { name: 'Mobile', visitors: 750, color: 'hsl(var(--chart-2))' },
  { name: 'Tablet', visitors: 120, color: 'hsl(var(--chart-4))' },
];

const placeholderTrafficSourceData = [
    { name: 'GitHub', visitors: 300, color: 'hsl(var(--chart-1))' },
    { name: 'LinkedIn', visitors: 250, color: 'hsl(var(--chart-2))' },
    { name: 'Google', visitors: 400, color: 'hsl(var(--chart-3))' },
    { name: 'Direct', visitors: 150, color: 'hsl(var(--chart-5))' },
];


const StatCard = ({ title, value, icon: Icon, description, isLoading, valueClassName }: { title: string; value: string | number; icon: React.ElementType; description: string, isLoading?: boolean, valueClassName?: string }) => (
  <Card className="shadow-md hover:shadow-lg transition-shadow">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <Icon className="h-5 w-5 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <div className="h-8 w-2/3 bg-muted animate-pulse rounded-md my-1"></div>
      ) : (
        <div className={`text-2xl font-bold ${valueClassName || ''}`}>{value}</div>
      )}
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </CardContent>
  </Card>
);

export default function DashboardOverview() {
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const autoRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [isAnalyticsTrackingEnabled, setIsAnalyticsTrackingEnabled] = useState(true);
  const [isLoadingAppSettings, setIsLoadingAppSettings] = useState(true);


  // Individual metric states
  const [totalProjectViews, setTotalProjectViews] = useState<number | null>(null);
  const [isLoadingTotalProjectViews, setIsLoadingTotalProjectViews] = useState(true);

  const [mostViewedProjectData, setMostViewedProjectData] = useState<MostViewedProjectData>({ title: null, views: null });
  const [isLoadingMostViewedProject, setIsLoadingMostViewedProject] = useState(true);

  const [mostInteractedSkillData, setMostInteractedSkillData] = useState<MostInteractedSkillData>({ name: null, interactions: null });
  const [isLoadingMostInteractedSkill, setIsLoadingMostInteractedSkill] = useState(true);

  const [totalResumeDownloads, setTotalResumeDownloads] = useState<number | null>(null);
  const [isLoadingResumeDownloads, setIsLoadingResumeDownloads] = useState(true);

  const [recentSubmissionsCount, setRecentSubmissionsCount] = useState<number | null>(null);
  const [isLoadingRecentSubmissions, setIsLoadingRecentSubmissions] = useState(true);

  const fetchDashboardData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);

    setIsLoadingTotalProjectViews(true);
    setIsLoadingMostViewedProject(true);
    setIsLoadingMostInteractedSkill(true);
    setIsLoadingRecentSubmissions(true);
    setIsLoadingResumeDownloads(true);
    setIsLoadingAppSettings(true);

    try {
      // Fetch Site Settings (including tracking toggle)
      const { data: settingsData, error: settingsError } = await supabase
        .from('site_settings')
        .select('is_analytics_tracking_enabled')
        .eq('id', ADMIN_SITE_SETTINGS_ID)
        .maybeSingle();

      if (settingsError) {
        console.error("[DashboardOverview] Error fetching site settings:", settingsError);
        toast({ title: "Error", description: "Could not load site settings for tracking status.", variant: "destructive"});
      } else if (settingsData) {
        setIsAnalyticsTrackingEnabled(settingsData.is_analytics_tracking_enabled);
      }
      setIsLoadingAppSettings(false);


      // Fetch Total Project Views
      const { count: viewsCount, error: viewsError } = await supabase
        .from('project_views')
        .select('*', { count: 'exact', head: true });
      if (viewsError) console.error("[DashboardOverview] Error fetching total project views:", viewsError);
      setTotalProjectViews(viewsCount ?? 0);
      setIsLoadingTotalProjectViews(false);

      // Fetch Most Viewed Project
      const { data: allProjectViews, error: allProjectViewsError } = await supabase
        .from('project_views')
        .select('project_id');
      if (allProjectViewsError) {
        console.error("Error fetching project views for aggregation:", JSON.stringify(allProjectViewsError, null, 2));
        setMostViewedProjectData({ title: 'Error Loading', views: 0 });
      } else if (allProjectViews && allProjectViews.length > 0) {
        const viewCounts: Record<string, number> = {};
        allProjectViews.forEach(view => { if (view.project_id) viewCounts[view.project_id] = (viewCounts[view.project_id] || 0) + 1; });
        let maxViews = 0; let mostViewedId: string | null = null;
        for (const projectId in viewCounts) { if (viewCounts[projectId] > maxViews) { maxViews = viewCounts[projectId]; mostViewedId = projectId; }}
        if (mostViewedId) {
          const { data: projectData, error: projectError } = await supabase.from('projects').select('title').eq('id', mostViewedId).single();
          if (projectError) setMostViewedProjectData({ title: 'Project Title Error', views: maxViews });
          else setMostViewedProjectData({ title: projectData?.title || 'Unknown Project', views: maxViews });
        } else { setMostViewedProjectData({ title: 'N/A (No Views)', views: 0 }); }
      } else { setMostViewedProjectData({ title: 'N/A (No Views)', views: 0 }); }
      setIsLoadingMostViewedProject(false);

      // Fetch Most Interacted Skill
      const { data: allInteractions, error: allInteractionsError } = await supabase
        .from('skill_interactions')
        .select('skill_id');
      if (allInteractionsError) {
        console.error("Error fetching skill interactions for aggregation:", JSON.stringify(allInteractionsError, null, 2));
        setMostInteractedSkillData({ name: 'Error Loading', interactions: 0 });
      } else if (allInteractions && allInteractions.length > 0) {
        const interactionCounts: Record<string, number> = {};
        allInteractions.forEach(interaction => { if (interaction.skill_id) interactionCounts[interaction.skill_id] = (interactionCounts[interaction.skill_id] || 0) + 1; });
        let maxInteractions = 0; let mostInteractedSkillId: string | null = null;
        for (const skillId in interactionCounts) { if (interactionCounts[skillId] > maxInteractions) { maxInteractions = interactionCounts[skillId]; mostInteractedSkillId = skillId; }}
        if (mostInteractedSkillId) {
          const { data: skillData, error: skillError } = await supabase.from('skills').select('name').eq('id', mostInteractedSkillId).single();
          if (skillError) setMostInteractedSkillData({ name: 'Skill Name Error', interactions: maxInteractions });
          else setMostInteractedSkillData({ name: skillData?.name || 'Unknown Skill', interactions: maxInteractions });
        } else { setMostInteractedSkillData({ name: 'N/A (No Interactions)', interactions: 0 }); }
      } else { setMostInteractedSkillData({ name: 'N/A (No Interactions)', interactions: 0 }); }
      setIsLoadingMostInteractedSkill(false);

      // Fetch Total Resume Downloads
      const { count: resumeDownloadsCount, error: resumeError } = await supabase
        .from('resume_downloads')
        .select('*', { count: 'exact', head: true });
      if (resumeError) console.error("[DashboardOverview] Error fetching total resume downloads:", resumeError);
      setTotalResumeDownloads(resumeDownloadsCount ?? 0);
      setIsLoadingResumeDownloads(false);

      // Fetch Recent Contact Submissions Count
      const sevenDaysAgo = subDays(new Date(), 7).toISOString();
      const { count: submissionsCount, error: submissionsError } = await supabase
        .from('contact_submissions')
        .select('*', { count: 'exact', head: true })
        .gte('submitted_at', sevenDaysAgo);
      if (submissionsError) console.error("[DashboardOverview] Error fetching recent contact submissions:", submissionsError);
      setRecentSubmissionsCount(submissionsCount ?? 0);
      setIsLoadingRecentSubmissions(false);

      setLastRefreshed(new Date());
      if (isManualRefresh) {
        toast({ title: "Success", description: "Dashboard data updated ✅" });
      }

    } catch (error) {
      console.error("[DashboardOverview] General error fetching dashboard data:", error);
      toast({ title: "Error", description: "Could not refresh all dashboard data.", variant: "destructive"});
    } finally {
      if (isManualRefresh) setIsRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDashboardData(); // Initial fetch
    
    // Set up auto-refresh
    if (autoRefreshTimerRef.current) clearInterval(autoRefreshTimerRef.current);
    autoRefreshTimerRef.current = setInterval(() => {
      console.log("[DashboardOverview] Auto-refreshing data...");
      fetchDashboardData(false); // false indicates not a manual refresh
    }, AUTO_REFRESH_INTERVAL_MS);

    return () => {
      if (autoRefreshTimerRef.current) clearInterval(autoRefreshTimerRef.current);
    };
  }, [fetchDashboardData]);

  const handleManualRefresh = () => {
    if (!isRefreshing) {
      fetchDashboardData(true);
    }
  };

  const handleToggleAnalyticsTracking = async (checked: boolean) => {
    setIsLoadingAppSettings(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        toast({ title: "Auth Error", description: "Please log in to change settings.", variant: "destructive"});
        setIsLoadingAppSettings(false);
        return;
    }

    const { error: updateError } = await supabase
      .from('site_settings')
      .update({ is_analytics_tracking_enabled: checked, updated_at: new Date().toISOString() })
      .eq('id', ADMIN_SITE_SETTINGS_ID);

    if (updateError) {
      console.error("Error updating analytics tracking setting:", updateError);
      toast({ title: "Error", description: `Failed to update tracking setting: ${updateError.message}`, variant: "destructive" });
      // Revert UI optimistically if needed, or re-fetch
      setIsAnalyticsTrackingEnabled(!checked);
    } else {
      setIsAnalyticsTrackingEnabled(checked);
      toast({ title: "Success", description: `Analytics tracking ${checked ? 'enabled' : 'disabled'}.` });
       try {
        await supabase.from('admin_activity_log').insert({
            action_type: checked ? 'ANALYTICS_TRACKING_ENABLED' : 'ANALYTICS_TRACKING_DISABLED',
            description: `Admin ${checked ? 'enabled' : 'disabled'} site-wide analytics tracking.`,
            user_identifier: user.id
        });
      } catch (logError) {
          console.error("Error logging analytics tracking toggle:", logError);
      }
    }
    setIsLoadingAppSettings(false);
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <CardTitle className="text-2xl">Portfolio Overview</CardTitle>
              <CardDescription>
                A quick glance at your portfolio's engagement and activity.
                {lastRefreshed && (
                  <span className="block text-xs text-muted-foreground/80 mt-1">
                    Last updated: {formatDistanceToNow(lastRefreshed, { addSuffix: true })}
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                 <div className="flex items-center space-x-2 p-2 border rounded-md bg-card-foreground/5 dark:bg-card-foreground/10 w-full sm:w-auto justify-between">
                    <Label htmlFor="analytics-tracking-switch" className="text-sm font-medium">
                      Analytics Tracking
                    </Label>
                    {isLoadingAppSettings ? <Loader2 className="h-4 w-4 animate-spin" /> :
                        <Switch
                        id="analytics-tracking-switch"
                        checked={isAnalyticsTrackingEnabled}
                        onCheckedChange={handleToggleAnalyticsTracking}
                        aria-label="Toggle analytics tracking"
                        />
                    }
                </div>
                <Button onClick={handleManualRefresh} disabled={isRefreshing} variant="outline" size="sm" className="w-full sm:w-auto">
                    {isRefreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                    Refresh Data
                </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl flex items-center"><ShoppingBag className="mr-2 h-6 w-6 text-primary" />Project & Skill Engagement</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatCard 
            title="Total Project Views" 
            value={totalProjectViews ?? 0} 
            icon={Eye} 
            description="Across all projects (based on card views)" 
            isLoading={isLoadingTotalProjectViews} 
          />
          <StatCard 
            title="Most Viewed Project" 
            value={isLoadingMostViewedProject ? "Loading..." : `${mostViewedProjectData.title || 'N/A'} (${mostViewedProjectData.views ?? 0} views)`}
            icon={TrendingUp} 
            description="Project with highest card views" 
            isLoading={isLoadingMostViewedProject}
            valueClassName="truncate text-lg sm:text-xl" 
          />
          <StatCard 
            title="Most Interacted Skill" 
            value={isLoadingMostInteractedSkill ? "Loading..." : `${mostInteractedSkillData.name || 'N/A'} (${mostInteractedSkillData.interactions ?? 0} interactions)`}
            icon={Brain} 
            description="Skill with most user interactions (views)" 
            isLoading={isLoadingMostInteractedSkill}
            valueClassName="truncate text-lg sm:text-xl"
          />
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl flex items-center"><Download className="mr-2 h-6 w-6 text-primary" />Resume & Submissions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <StatCard 
            title="Total Resume Downloads" 
            value={totalResumeDownloads ?? 0} 
            icon={Download} 
            description="Track PDF downloads" 
            isLoading={isLoadingResumeDownloads}
          />
          <StatCard 
            title="Contact Submissions (7 Days)" 
            value={recentSubmissionsCount ?? 0} 
            icon={Mail} 
            description="New messages from contact form" 
            isLoading={isLoadingRecentSubmissions}
          />
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl flex items-center"><Users className="mr-2 h-6 w-6 text-primary" />Visitor Analytics (Placeholders)</CardTitle>
          <CardDescription>For comprehensive insights, integrate a dedicated analytics service.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
           <StatCard title="Visitors by Device Type" value={"N/A"} icon={Users} description="Mobile / Desktop / Tablet (via analytics service)" isLoading={true}/>
           <StatCard title="Top Traffic Sources" value={"N/A"} icon={LinkIcon} description="e.g., GitHub, LinkedIn (via analytics service)" isLoading={true}/>
        </CardContent>
         <CardContent>
            <h3 className="text-lg font-semibold mb-2 text-muted-foreground mt-4">Visitors by Device Type (Placeholder Chart)</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={placeholderDeviceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    itemStyle={{ color: 'hsl(var(--card-foreground))' }}
                    cursor={{ fill: 'hsl(var(--muted))' }}
                />
                <Bar dataKey="visitors" name="Visitors" radius={[0, 4, 4, 0]}>
                    {placeholderDeviceData.map((entry, index) => (
                        <Cell key={`cell-device-${index}`} fill={entry.color} />
                    ))}
                </Bar>
                </BarChart>
            </ResponsiveContainer>
        </CardContent>
         <CardContent>
            <h3 className="text-lg font-semibold mb-2 text-muted-foreground mt-4">Top Traffic Sources (Placeholder Chart)</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={placeholderTrafficSourceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip 
                     contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                     itemStyle={{ color: 'hsl(var(--card-foreground))' }}
                     cursor={{ fill: 'hsl(var(--muted))' }}
                />
                <Bar dataKey="visitors" name="Visitors" radius={[4, 4, 0, 0]}>
                    {placeholderTrafficSourceData.map((entry, index) => (
                        <Cell key={`cell-source-${index}`} fill={entry.color} />
                    ))}
                </Bar>
                </BarChart>
            </ResponsiveContainer>
        </CardContent>
      </Card>
      
      <Card className="shadow-sm border-yellow-500/50 dark:border-yellow-400/40 bg-yellow-50/50 dark:bg-yellow-900/10">
        <CardHeader>
            <CardTitle className="text-lg flex items-center text-yellow-700 dark:text-yellow-500"><AlertCircle className="mr-2 h-5 w-5"/>Implementation Notes</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-yellow-600 dark:text-yellow-400/80 space-y-2">
            <p><strong>Analytics Tracking Toggle:</strong> This toggle enables/disables logging for Project Views, Skill Interactions, and Resume Downloads. You will need to update the public-facing components (`ProjectCard.tsx`, `SkillCard.tsx`, `ResumeSectionClientView.tsx`) to fetch this setting and conditionally log these events.</p>
            <p><strong>Visitor Analytics & Charts:</strong> These currently use placeholder data. For real data, integrate an analytics service or implement custom event logging for clicks on external links and more detailed page visit information.</p>
        </CardContent>
      </Card>
    </div>
  );
}
