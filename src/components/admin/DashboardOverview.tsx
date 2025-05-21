// src/components/admin/DashboardOverview.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Eye, Brain, FolderKanban, LineChart, Users, Download, Mail, Link as LinkIcon, BarChart3, Clock, TrendingUp, AlertCircle, ShoppingBag, Loader2 } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, Legend as RechartsLegend, Cell } from 'recharts';
import { supabase } from '@/lib/supabaseClient';
import { subDays, format } from 'date-fns';
import type { Project, Skill, ContactSubmission, ResumeDownload, ProjectView, SkillInteraction } from '@/types/supabase';

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

  useEffect(() => {
    const fetchDashboardData = async () => {
      console.log("[DashboardOverview] Starting to fetch all dashboard data...");
      setIsLoadingTotalProjectViews(true);
      setIsLoadingMostViewedProject(true);
      setIsLoadingMostInteractedSkill(true);
      setIsLoadingRecentSubmissions(true);
      setIsLoadingResumeDownloads(true);

      try {
        // Fetch Total Project Views
        const { count: viewsCount, error: viewsError } = await supabase
          .from('project_views')
          .select('*', { count: 'exact', head: true });
        if (viewsError) {
          console.error("[DashboardOverview] Error fetching total project views:", viewsError);
          setTotalProjectViews(0); // Default to 0 on error
        } else {
          setTotalProjectViews(viewsCount ?? 0);
        }
      } catch (error) {
        console.error("[DashboardOverview] Exception fetching total project views:", error);
        setTotalProjectViews(0);
      }
      setIsLoadingTotalProjectViews(false);

      // Fetch Most Viewed Project
      try {
        const { data: allProjectViews, error: allProjectViewsError } = await supabase
          .from('project_views')
          .select('project_id');
        
        if (allProjectViewsError) {
          console.error("Error fetching project views for aggregation:", JSON.stringify(allProjectViewsError, null, 2));
          setMostViewedProjectData({ title: 'Error Loading', views: 0 });
        } else if (allProjectViews && allProjectViews.length > 0) {
          const viewCounts: Record<string, number> = {};
          allProjectViews.forEach(view => {
            if (view.project_id) {
              viewCounts[view.project_id] = (viewCounts[view.project_id] || 0) + 1;
            }
          });

          let maxViews = 0;
          let mostViewedId: string | null = null;
          for (const projectId in viewCounts) {
            if (viewCounts[projectId] > maxViews) {
              maxViews = viewCounts[projectId];
              mostViewedId = projectId;
            }
          }

          if (mostViewedId) {
            const { data: projectData, error: projectError } = await supabase
              .from('projects')
              .select('title')
              .eq('id', mostViewedId)
              .single();
            if (projectError) {
              console.error("[DashboardOverview] Error fetching title for most viewed project:", projectError);
              setMostViewedProjectData({ title: 'Project Title Error', views: maxViews });
            } else {
              setMostViewedProjectData({ title: projectData?.title || 'Unknown Project', views: maxViews });
            }
          } else {
            setMostViewedProjectData({ title: 'N/A (No Views Yet)', views: 0 });
          }
        } else {
          setMostViewedProjectData({ title: 'N/A (No Views Yet)', views: 0 });
        }
      } catch (error) {
         console.error("[DashboardOverview] Exception processing most viewed project:", error);
         setMostViewedProjectData({ title: 'Error Loading Data', views: 0 });
      }
      setIsLoadingMostViewedProject(false);

      // Fetch Most Interacted Skill
      try {
        const { data: allInteractions, error: allInteractionsError } = await supabase
            .from('skill_interactions')
            .select('skill_id');

        if (allInteractionsError) {
            let errorMessage = `Error fetching skill interactions. Supabase code: ${allInteractionsError.code}. Message: ${allInteractionsError.message || 'Unknown error.'}`;
            if (typeof allInteractionsError === 'object' && allInteractionsError !== null) {
                const supabaseError = allInteractionsError as any;
                errorMessage += ` Details: ${supabaseError.details || 'N/A'}, Hint: ${supabaseError.hint || 'N/A'}`;
                 if (supabaseError.code === '42P01') { // PostgreSQL error code for "undefined_table"
                    errorMessage += " This means the 'skill_interactions' table does not exist or is not accessible. Please create it and check RLS policies.";
                }
            }
            console.error("[DashboardOverview] Full skill interactions error object:", JSON.stringify(allInteractionsError, null, 2));
            console.error("[DashboardOverview]", errorMessage);
            setMostInteractedSkillData({ name: 'Error Loading', interactions: 0 });
        } else if (allInteractions && allInteractions.length > 0) {
            const interactionCounts: Record<string, number> = {};
            allInteractions.forEach(interaction => {
                if (interaction.skill_id) {
                    interactionCounts[interaction.skill_id] = (interactionCounts[interaction.skill_id] || 0) + 1;
                }
            });
            let maxInteractions = 0;
            let mostInteractedSkillId: string | null = null;
            for (const skillId in interactionCounts) {
                if (interactionCounts[skillId] > maxInteractions) {
                    maxInteractions = interactionCounts[skillId];
                    mostInteractedSkillId = skillId;
                }
            }
            if (mostInteractedSkillId) {
                const { data: skillData, error: skillError } = await supabase
                    .from('skills')
                    .select('name')
                    .eq('id', mostInteractedSkillId)
                    .single();
                if (skillError) {
                    console.error("[DashboardOverview] Error fetching name for most interacted skill:", skillError);
                    setMostInteractedSkillData({ name: 'Skill Name Error', interactions: maxInteractions });
                } else {
                    setMostInteractedSkillData({ name: skillData?.name || 'Unknown Skill', interactions: maxInteractions });
                }
            } else {
                setMostInteractedSkillData({ name: 'N/A (No Interactions Yet)', interactions: 0 });
            }
        } else {
            setMostInteractedSkillData({ name: 'N/A (No Interactions Yet)', interactions: 0 });
        }
      } catch (error) {
        console.error("[DashboardOverview] Exception processing most interacted skill:", error);
        setMostInteractedSkillData({ name: 'Error Loading Skill Data', interactions: 0 });
      }
      setIsLoadingMostInteractedSkill(false);

      // Fetch Total Resume Downloads
      try {
        const { count: resumeDownloadsCount, error: resumeError } = await supabase
          .from('resume_downloads')
          .select('*', { count: 'exact', head: true });
        if (resumeError) {
            console.error("[DashboardOverview] Error fetching total resume downloads:", resumeError);
            setTotalResumeDownloads(0);
        } else {
            setTotalResumeDownloads(resumeDownloadsCount ?? 0);
        }
      } catch (error) {
        console.error("[DashboardOverview] Exception fetching total resume downloads:", error);
        setTotalResumeDownloads(0);
      }
      setIsLoadingResumeDownloads(false);

      // Fetch Recent Contact Submissions Count
      try {
        const sevenDaysAgo = subDays(new Date(), 7).toISOString();
        const { count: submissionsCount, error: submissionsError } = await supabase
          .from('contact_submissions')
          .select('*', { count: 'exact', head: true })
          .gte('submitted_at', sevenDaysAgo);
        if (submissionsError) {
            console.error("[DashboardOverview] Error fetching recent contact submissions:", submissionsError);
            setRecentSubmissionsCount(0);
        } else {
            setRecentSubmissionsCount(submissionsCount ?? 0);
        }
      } catch (error) {
        console.error("[DashboardOverview] Exception fetching recent contact submissions:", error);
        setRecentSubmissionsCount(0);
      }
      setIsLoadingRecentSubmissions(false);
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Portfolio Overview</CardTitle>
          <CardDescription>A quick glance at your portfolio's engagement and activity.</CardDescription>
        </CardHeader>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl flex items-center"><ShoppingBag className="mr-2 h-6 w-6 text-primary" />Project & Skill Engagement</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"> {/* Changed to lg:grid-cols-3 */}
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
            value={isLoadingMostInteractedSkill ? "Loading..." : `${mostInteractedSkillData.name || 'N/A'} (${mostInteractedSkillData.interactions ?? 0} views)`}
            icon={Brain} 
            description="Skill with most card views (requires tracking)" 
            isLoading={isLoadingMostInteractedSkill}
            valueClassName="truncate text-lg sm:text-xl"
          />
          {/* Project Category Popularity card removed */}
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
            description="Track PDF downloads (requires client-side event logging)" 
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
            <p><strong>"Most Interacted Skill" (tracking views):</strong> This feature is now active. It logs an interaction to the `skill_interactions` table each time a `SkillCard` is displayed on your public site.</p>
            <p><strong>"Total Resume Downloads":</strong> This requires you to complete the client-side event logging in `ResumeSectionClientView.tsx` to insert a record into `resume_downloads` table when the download button is clicked.</p>
            <p><strong>Visitor Analytics & Charts:</strong> These currently use placeholder data. For real data, integrate an analytics service or implement custom event logging.</p>
        </CardContent>
      </Card>
    </div>
  );
}
