
// src/components/admin/DashboardOverview.tsx
"use client";

import React, { useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Eye, Brain, Download, Mail, BarChart3, Clock, TrendingUp, AlertCircle, 
  Loader2, RefreshCw, Users, Settings2, Smartphone, Tablet, Monitor, HardDrive, Database as DatabaseIcon
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, Legend as RechartsLegend, Cell } from 'recharts';
import { supabase } from '@/lib/supabaseClient';
import { subDays, format, isValid as isValidDate, formatDistanceToNow, parseISO } from 'date-fns';
import type { SiteSettings, ProjectView, SkillInteraction, ResumeDownload, ContactSubmission, Project, Skill, VisitorLog } from '@/types/supabase';

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

interface DeviceTypeData {
    name: VisitorLog['device_type'] | 'Other' | 'Unknown';
    visitors: number;
    color: string;
    icon: React.ElementType;
}

const StatCard = ({ title, value, icon: Icon, description, isLoading, valueClassName }: { title: string; value?: string | number | null; icon: React.ElementType; description: string, isLoading?: boolean, valueClassName?: string }) => (
  <Card className="shadow-md hover:shadow-lg transition-shadow">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <Icon className="h-5 w-5 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <div className="text-2xl font-bold">...</div>
      ) : (value !== undefined && value !== null && value !== "N/A" && value !== "Error") ? (
        <div className={`text-2xl font-bold ${valueClassName || ''}`}>{value}</div>
      ) : (
        <div className="text-2xl font-bold text-muted-foreground/70">{value === "Error" ? "Error" : (value === "N/A" ? "N/A" : "0")}</div>
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

  const [deviceTypeData, setDeviceTypeData] = useState<DeviceTypeData[]>([]);
  const [isLoadingDeviceTypeData, setIsLoadingDeviceTypeData] = useState(true);

  const [databaseSize, setDatabaseSize] = useState<string | null>(null);
  const [isLoadingDbSize, setIsLoadingDbSize] = useState(true);
  const [bucketStorageUsed, setBucketStorageUsed] = useState<string | null>(null);
  const [isLoadingBucketStorage, setIsLoadingBucketStorage] = useState(true);


  const fetchDashboardData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh && isRefreshing) return; 
    if (isManualRefresh) setIsRefreshing(true);
    
    console.log("[DashboardOverview] Fetching all dashboard data...");

    setIsLoadingAppSettings(true);
    setIsLoadingTotalProjectViews(true);
    setIsLoadingMostViewedProject(true);
    setIsLoadingMostInteractedSkill(true);
    setIsLoadingResumeDownloads(true);
    setIsLoadingRecentSubmissions(true);
    setIsLoadingDeviceTypeData(true);
    setIsLoadingDbSize(true);
    setIsLoadingBucketStorage(true);

    try {
      // Site Settings (Tracking Toggle)
      const { data: settingsData, error: settingsError } = await supabase
        .from('site_settings')
        .select('is_analytics_tracking_enabled')
        .eq('id', ADMIN_SITE_SETTINGS_ID)
        .maybeSingle();
      if (settingsError) console.error("[DashboardOverview] Error fetching site settings:", JSON.stringify(settingsError, null, 2));
      else if (settingsData) setIsAnalyticsTrackingEnabled(settingsData.is_analytics_tracking_enabled ?? true);
      setIsLoadingAppSettings(false);

      // Total Project Views
      const { count: viewsCount, error: viewsError } = await supabase.from('project_views').select('*', { count: 'exact', head: true });
      if (viewsError) { console.error("[DashboardOverview] Error fetching total project views:", JSON.stringify(viewsError, null, 2)); setTotalProjectViews(0); }
      else setTotalProjectViews(viewsCount ?? 0);
      setIsLoadingTotalProjectViews(false);

      // Most Viewed Project
      const { data: allProjectViews, error: allProjectViewsError } = await supabase.from('project_views').select('project_id');
      if (allProjectViewsError) {
        console.error("[DashboardOverview] Error fetching project views for aggregation:", JSON.stringify(allProjectViewsError, null, 2));
        setMostViewedProjectData({ title: 'Error', views: 0 });
      } else if (allProjectViews && allProjectViews.length > 0) {
        const viewCounts: Record<string, number> = {};
        allProjectViews.forEach(view => { if (view.project_id) viewCounts[view.project_id] = (viewCounts[view.project_id] || 0) + 1; });
        let maxViews = 0; let mostViewedId: string | null = null;
        for (const projectId in viewCounts) { if (viewCounts[projectId] > maxViews) { maxViews = viewCounts[projectId]; mostViewedId = projectId; }}
        if (mostViewedId) {
          const { data: projectData, error: projectError } = await supabase.from('projects').select('title').eq('id', mostViewedId).maybeSingle();
          setMostViewedProjectData({ title: projectError ? 'DB Error' : (projectData?.title || 'Unknown Project'), views: maxViews });
        } else { setMostViewedProjectData({ title: 'N/A (No Views)', views: 0 }); }
      } else { setMostViewedProjectData({ title: 'N/A (No Views)', views: 0 }); }
      setIsLoadingMostViewedProject(false);
      
      // Most Interacted Skill
      const { data: allInteractions, error: allInteractionsError } = await supabase.from('skill_interactions').select('skill_id');
      if (allInteractionsError) {
        console.error("[DashboardOverview] Error fetching skill interactions:", JSON.stringify(allInteractionsError, null, 2));
        let specificMessage = `Could not fetch skill interactions: ${allInteractionsError.message}.`;
        if (allInteractionsError.message?.includes("relation") && allInteractionsError.message.includes("does not exist")) {
            specificMessage = "The 'skill_interactions' table does not exist. Please ensure it's created as per the SQL schema.";
        } else if ((allInteractionsError as any).code === '42P01' || allInteractionsError.message?.includes('42P01') ) { 
            specificMessage = "Database error: The 'skill_interactions' table seems to be missing. Please create it.";
        }
        setMostInteractedSkillData({ name: 'Error', interactions: 0 });
      } else if (allInteractions && allInteractions.length > 0) {
        const interactionCounts: Record<string, number> = {};
        allInteractions.forEach(interaction => { if(interaction.skill_id) interactionCounts[interaction.skill_id] = (interactionCounts[interaction.skill_id] || 0) + 1; });
        let maxInteractions = 0; let mostInteractedSkillId: string | null = null;
        for (const skillId in interactionCounts) { if (interactionCounts[skillId] > maxInteractions) { maxInteractions = interactionCounts[skillId]; mostInteractedSkillId = skillId; }}
        if (mostInteractedSkillId) {
          const { data: skillData, error: skillError } = await supabase.from('skills').select('name').eq('id', mostInteractedSkillId).maybeSingle();
          setMostInteractedSkillData({ name: skillError ? 'DB Error' : (skillData?.name || 'Unknown Skill'), interactions: maxInteractions });
        } else { setMostInteractedSkillData({ name: 'N/A', interactions: 0 }); }
      } else { setMostInteractedSkillData({ name: 'N/A', interactions: 0 }); }
      setIsLoadingMostInteractedSkill(false);

      // Total Resume Downloads
      const { count: resumeDownloadsCount, error: resumeError } = await supabase.from('resume_downloads').select('*', { count: 'exact', head: true });
      if (resumeError) { console.error("[DashboardOverview] Error fetching resume downloads:", JSON.stringify(resumeError, null, 2)); setTotalResumeDownloads(0); }
      else setTotalResumeDownloads(resumeDownloadsCount ?? 0);
      setIsLoadingResumeDownloads(false);

      // Recent Contact Submissions
      const sevenDaysAgo = subDays(new Date(), 7).toISOString();
      const { count: submissionsCount, error: submissionsError } = await supabase.from('contact_submissions').select('*', { count: 'exact', head: true }).gte('submitted_at', sevenDaysAgo);
      if (submissionsError) { console.error("[DashboardOverview] Error fetching recent submissions:", JSON.stringify(submissionsError, null, 2)); setRecentSubmissionsCount(0); }
      else setRecentSubmissionsCount(submissionsCount ?? 0);
      setIsLoadingRecentSubmissions(false);

      // Visitor Device Types
      const { data: rawDeviceData, error: deviceCountsError } = await supabase
        .from('visitor_logs')
        .select('device_type');
      if (deviceCountsError) {
        console.error("[DashboardOverview] Error fetching device type counts:", JSON.stringify(deviceCountsError, null, 2));
        setDeviceTypeData([]);
      } else if (rawDeviceData) {
        const counts: Record<string, number> = rawDeviceData.reduce((acc, log) => {
          const device = log.device_type || 'Unknown';
          acc[device] = (acc[device] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        const formattedDeviceData: DeviceTypeData[] = Object.entries(counts).map(([name, visitors]) => {
            let iconComponent: React.ElementType = Users; let barColor = 'hsl(var(--chart-5))';
            if (name === 'Desktop') { iconComponent = Monitor; barColor = 'hsl(var(--chart-1))'; }
            else if (name === 'Mobile') { iconComponent = Smartphone; barColor = 'hsl(var(--chart-2))'; }
            else if (name === 'Tablet') { iconComponent = Tablet; barColor = 'hsl(var(--chart-4))'; }
            else if (name === 'Unknown') { iconComponent = AlertCircle; barColor = 'hsl(var(--muted))'}
            return { name: name as VisitorLog['device_type'] | 'Other' | 'Unknown', visitors, color: barColor, icon: iconComponent };
        }).sort((a, b) => b.visitors - a.visitors);
        setDeviceTypeData(formattedDeviceData);
      } else { setDeviceTypeData([]); }
      setIsLoadingDeviceTypeData(false);

      // Supabase Storage & DB Metrics from Edge Function
      console.log("[DashboardOverview] Invoking 'get-storage-metrics' Edge Function...");
      const { data: storageMetrics, error: storageMetricsError } = await supabase.functions.invoke('get-storage-metrics');
      
      if (storageMetricsError) {
        console.error("[DashboardOverview] Error invoking 'get-storage-metrics' Edge Function:", JSON.stringify(storageMetricsError, null, 2));
        toast({ title: "Metrics Error", description: "Could not load Supabase storage/DB size from Edge Function.", variant: "destructive" });
        setDatabaseSize("Invoke Error");
        setBucketStorageUsed("Invoke Error");
      } else if (storageMetrics) {
        console.log("[DashboardOverview] Received storage metrics from Edge Function:", storageMetrics);
        setDatabaseSize(storageMetrics.databaseSize || "N/A");
        setBucketStorageUsed(storageMetrics.bucketStorageUsed || "N/A (See Dashboard)");
      } else {
        console.warn("[DashboardOverview] 'get-storage-metrics' Edge Function returned no data or unexpected structure.");
        setDatabaseSize("N/A - No Data");
        setBucketStorageUsed("N/A - No Data");
      }
      setIsLoadingDbSize(false);
      setIsLoadingBucketStorage(false);


      setLastRefreshed(new Date());
      if (isManualRefresh) toast({ title: "Success", description: "Dashboard data updated ✅" });

    } catch (error: any) {
      console.error("[DashboardOverview] General error fetching dashboard data:", error);
      toast({ title: "Error", description: `Could not refresh all dashboard data: ${error.message}`, variant: "destructive"});
      // Set all loading states to false and error indicators if a general catch occurs
      setIsLoadingAppSettings(false); setIsLoadingTotalProjectViews(false); setIsLoadingMostViewedProject(false);
      setIsLoadingMostInteractedSkill(false); setIsLoadingResumeDownloads(false); setIsLoadingRecentSubmissions(false);
      setIsLoadingDeviceTypeData(false); setIsLoadingDbSize(false); setIsLoadingBucketStorage(false);
      setDatabaseSize("Fetch Error"); setBucketStorageUsed("Fetch Error");
    } finally {
      if (isManualRefresh) setIsRefreshing(false);
      console.log("[DashboardOverview] Finished fetching all dashboard data.");
    }
  }, [toast, isRefreshing]); 

  useEffect(() => {
    fetchDashboardData(); 
    if (autoRefreshTimerRef.current) clearInterval(autoRefreshTimerRef.current);
    autoRefreshTimerRef.current = setInterval(() => {
      console.log("[DashboardOverview] Auto-refreshing data...");
      fetchDashboardData(false);
    }, AUTO_REFRESH_INTERVAL_MS);
    return () => { if (autoRefreshTimerRef.current) clearInterval(autoRefreshTimerRef.current); };
  }, [fetchDashboardData]); 

  const handleManualRefresh = () => { if (!isRefreshing) fetchDashboardData(true); };

  const handleToggleAnalyticsTracking = async (checked: boolean) => {
    setIsLoadingAppSettings(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { 
        toast({ title: "Auth Error", description: "Please log in again to change settings.", variant: "destructive"}); 
        setIsLoadingAppSettings(false); 
        setIsAnalyticsTrackingEnabled(!checked); 
        return; 
    }
    const { error: updateError } = await supabase
      .from('site_settings')
      .update({ is_analytics_tracking_enabled: checked, updated_at: new Date().toISOString() })
      .eq('id', ADMIN_SITE_SETTINGS_ID);

    if (updateError) { 
      toast({ title: "Error", description: `Failed to update tracking setting: ${updateError.message}`, variant: "destructive" }); 
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
        console.error("[DashboardOverview] Error logging analytics tracking toggle:", logError); 
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
                {lastRefreshed && (<span className="block text-xs text-muted-foreground/80 mt-1">Last updated: {formatDistanceToNow(lastRefreshed, { addSuffix: true })}</span>)}
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                 <div className="flex items-center space-x-2 p-2 border rounded-md bg-card-foreground/5 dark:bg-card-foreground/10 w-full sm:w-auto justify-between">
                    <Label htmlFor="analytics-tracking-switch" className="text-sm font-medium flex items-center whitespace-nowrap">
                      <Settings2 className="mr-2 h-4 w-4" /> Analytics Tracking
                    </Label>
                    {isLoadingAppSettings ? <Loader2 className="h-4 w-4 animate-spin ml-2 text-muted-foreground" /> : <Switch id="analytics-tracking-switch" checked={isAnalyticsTrackingEnabled} onCheckedChange={handleToggleAnalyticsTracking} aria-label="Toggle analytics tracking" className="ml-2"/> }
                </div>
                <Button onClick={handleManualRefresh} disabled={isRefreshing} variant="outline" size="sm" className="w-full sm:w-auto"> {isRefreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />} Refresh Data </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="shadow-sm">
        <CardHeader><CardTitle className="text-xl flex items-center"><TrendingUp className="mr-2 h-6 w-6 text-primary" />Project & Skill Engagement</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatCard title="Total Project Views" value={totalProjectViews} icon={Eye} description="Views logged for project cards" isLoading={isLoadingTotalProjectViews} />
          <StatCard 
            title="Most Viewed Project" 
            value={mostViewedProjectData.title ? `${mostViewedProjectData.title} (${mostViewedProjectData.views} views)` : (mostViewedProjectData.views === 0 ? 'N/A' : (isLoadingMostViewedProject ? '...' : 'N/A'))} 
            icon={TrendingUp} 
            description="Project with highest card views" 
            isLoading={isLoadingMostViewedProject} 
            valueClassName="truncate text-lg sm:text-xl"
          />
          <StatCard 
            title="Most Interacted Skill" 
            value={mostInteractedSkillData.name ? `${mostInteractedSkillData.name} (${mostInteractedSkillData.interactions} interactions)` : (mostInteractedSkillData.interactions === 0 ? 'N/A' : (isLoadingMostInteractedSkill ? '...' : 'N/A'))} 
            icon={Brain} 
            description="Skill with most card views/interactions" 
            isLoading={isLoadingMostInteractedSkill} 
            valueClassName="truncate text-lg sm:text-xl"
          />
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader><CardTitle className="text-xl flex items-center"><Download className="mr-2 h-6 w-6 text-primary" />Resume & Submissions</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <StatCard title="Total Resume Downloads" value={totalResumeDownloads} icon={Download} description="Tracked PDF downloads (requires client-side event logging)" isLoading={isLoadingResumeDownloads}/>
          <StatCard title="Contact Submissions (7 Days)" value={recentSubmissionsCount} icon={Mail} description="New messages from your contact form" isLoading={isLoadingRecentSubmissions}/>
        </CardContent>
      </Card>
      
      <Card className="shadow-sm">
        <CardHeader><CardTitle className="text-xl flex items-center"><Users className="mr-2 h-6 w-6 text-primary" />Visitor Analytics</CardTitle></CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-1"> 
            <div>
                <h3 className="text-lg font-semibold mb-3 text-card-foreground/90">Visitors by Device Type</h3>
                <div className="p-4 border rounded-lg bg-card-foreground/5 dark:bg-card-foreground/10 min-h-[300px]">
                {isLoadingDeviceTypeData ? <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/></div> : 
                  deviceTypeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={deviceTypeData} layout="vertical" margin={{ top: 5, right: 30, left: 30, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.5)" />
                            <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} tick={{ fill: 'hsl(var(--muted-foreground))' }}/>
                            <YAxis dataKey="name" type="category" width={100} stroke="hsl(var(--muted-foreground))" fontSize={12}
                                tick={({ x, y, payload }) => {
                                    const deviceConfig = deviceTypeData.find(d => d.name === payload.value);
                                    const DeviceIconComponent = deviceConfig?.icon || Users;
                                    return (
                                        <g transform={`translate(${x - 25},${y})`}>
                                            <DeviceIconComponent className="h-4 w-4 inline -translate-y-0.5 mr-1.5 text-muted-foreground" />
                                            <text x={10} y={0} dy={4} textAnchor="start" fill="hsl(var(--muted-foreground))" fontSize={12}>
                                                {payload.value}
                                            </text>
                                        </g>
                                    );
                                }}
                            />
                            <RechartsTooltip 
                                contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', color: 'hsl(var(--popover-foreground))' }} 
                                itemStyle={{ color: 'hsl(var(--popover-foreground))' }} 
                                cursor={{ fill: 'hsl(var(--accent)/0.3)' }}
                            />
                            <Bar dataKey="visitors" name="Visitors" radius={[0, 4, 4, 0]} barSize={25}>
                                {deviceTypeData.map((entry, index) => (<Cell key={`cell-device-${index}`} fill={entry.color} /> ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-muted-foreground py-10">No device data logged yet. Visit your public site to populate this chart.</p>
                  )
                }
                </div>
                <CardDescription className="text-xs text-muted-foreground mt-2 px-1">
                  Counts visits based on client-side screen width detection from the `visitor_logs` table.
                </CardDescription>
           </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader><CardTitle className="text-xl flex items-center"><DatabaseIcon className="mr-2 h-6 w-6 text-primary" />Supabase Usage</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <StatCard 
            title="Total Bucket Storage Used" 
            value={bucketStorageUsed} 
            icon={HardDrive} 
            description="Approximation. Check Supabase Dashboard for exact figures." 
            isLoading={isLoadingBucketStorage} 
          />
          <StatCard 
            title="Database Size" 
            value={databaseSize} 
            icon={DatabaseIcon} 
            description="Current size of your PostgreSQL database." 
            isLoading={isLoadingDbSize} 
          />
        </CardContent>
         <CardFooter>
            <CardDescription className="text-xs">
                Database size is fetched via an Edge Function. Total bucket storage is a placeholder; Supabase Dashboard provides the accurate total.
            </CardDescription>
        </CardFooter>
      </Card>

    </div>
  );
}

    
