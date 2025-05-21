
"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Eye, Brain, FolderKanban, LineChart, Users, Download, Mail, Link as LinkIcon, BarChart3, Clock, TrendingUp, AlertCircle, ShoppingBag } from 'lucide-react'; // Added ShoppingBag
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, Legend as RechartsLegend, Cell } from 'recharts';
import { supabase } from '@/lib/supabaseClient';
import { subDays, format } from 'date-fns';
import type { Project, Skill, ProjectView, SkillInteraction } from '@/types/supabase';

interface MostViewedProjectData {
  title: string | null;
  views: number | null;
}

interface MostInteractedSkillData {
  name: string | null;
  interactions: number | null;
}

const placeholderDeviceData = [
  { name: 'Desktop', visitors: 450, color: '#1E88E5' }, // Blue
  { name: 'Mobile', visitors: 750, color: '#43A047' },  // Green
  { name: 'Tablet', visitors: 120, color: '#FB8C00' },  // Orange
];

const placeholderTrafficSourceData = [
    { name: 'GitHub', visitors: 300, color: '#6E5494' },
    { name: 'LinkedIn', visitors: 250, color: '#0077B5' },
    { name: 'Google', visitors: 400, color: '#4285F4' },
    { name: 'Direct', visitors: 150, color: '#757575' },
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

  const [recentSubmissionsCount, setRecentSubmissionsCount] = useState<number | null>(null);
  const [isLoadingRecentSubmissions, setIsLoadingRecentSubmissions] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      // Fetch Total Project Views
      setIsLoadingTotalProjectViews(true);
      const { count: viewsCount, error: viewsError } = await supabase
        .from('project_views')
        .select('*', { count: 'exact', head: true });
      if (viewsError) console.error("Error fetching total project views:", viewsError);
      setTotalProjectViews(viewsCount ?? 0);
      setIsLoadingTotalProjectViews(false);

      // Fetch Most Viewed Project
      setIsLoadingMostViewedProject(true);
      const { data: allViews, error: allViewsError } = await supabase
        .from('project_views')
        .select('project_id');
      
      if (allViewsError) {
        console.error("Error fetching all project views for aggregation:", allViewsError);
        setMostViewedProjectData({ title: 'Error', views: 0 });
      } else if (allViews && allViews.length > 0) {
        const viewCounts: Record<string, number> = {};
        allViews.forEach(view => {
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
            console.error("Error fetching most viewed project title:", projectError);
            setMostViewedProjectData({ title: 'N/A', views: maxViews });
          } else {
            setMostViewedProjectData({ title: projectData?.title || 'Unknown Project', views: maxViews });
          }
        } else {
          setMostViewedProjectData({ title: 'N/A', views: 0 });
        }
      } else {
        setMostViewedProjectData({ title: 'N/A', views: 0 });
      }
      setIsLoadingMostViewedProject(false);

      // Fetch Most Interacted Skill
      setIsLoadingMostInteractedSkill(true);
      const { data: allInteractions, error: allInteractionsError } = await supabase
        .from('skill_interactions')
        .select('skill_id');

      if (allInteractionsError) {
        console.error("Error fetching skill interactions for aggregation:", allInteractionsError);
        setMostInteractedSkillData({ name: 'Error', interactions: 0 });
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
            console.error("Error fetching most interacted skill name:", skillError);
            setMostInteractedSkillData({ name: 'N/A', interactions: maxInteractions });
          } else {
            setMostInteractedSkillData({ name: skillData?.name || 'Unknown Skill', interactions: maxInteractions });
          }
        } else {
          setMostInteractedSkillData({ name: 'N/A', interactions: 0 });
        }
      } else {
        setMostInteractedSkillData({ name: 'N/A', interactions: 0 });
      }
      setIsLoadingMostInteractedSkill(false);


      // Fetch Recent Contact Submissions Count
      setIsLoadingRecentSubmissions(true);
      const sevenDaysAgo = subDays(new Date(), 7).toISOString();
      const { count: submissionsCount, error: submissionsError } = await supabase
        .from('contact_submissions')
        .select('*', { count: 'exact', head: true })
        .gte('submitted_at', sevenDaysAgo);
      if (submissionsError) console.error("Error fetching recent contact submissions:", submissionsError);
      setRecentSubmissionsCount(submissionsCount ?? 0);
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
            value={totalProjectViews ?? "..."} 
            icon={Eye} 
            description="Across all projects" 
            isLoading={isLoadingTotalProjectViews} 
          />
          <StatCard 
            title="Most Viewed Project" 
            value={isLoadingMostViewedProject ? "..." : `${mostViewedProjectData.title || 'N/A'} (${mostViewedProjectData.views ?? 0} views)`}
            icon={TrendingUp} 
            description="Highest single project engagement" 
            isLoading={isLoadingMostViewedProject}
            valueClassName="truncate text-lg sm:text-2xl"
          />
          <StatCard 
            title="Most Interacted Skill" 
            value={isLoadingMostInteractedSkill ? "..." : `${mostInteractedSkillData.name || 'N/A'} (${mostInteractedSkillData.interactions ?? 0} interactions)`}
            icon={Brain} 
            description="Based on skill interactions" 
            isLoading={isLoadingMostInteractedSkill}
            valueClassName="truncate text-lg sm:text-2xl"
          />
          {/* Removed Project Category Popularity Card */}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl flex items-center"><Download className="mr-2 h-6 w-6 text-primary" />Resume & Submissions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <StatCard title="Total Resume Downloads" value="N/A Yet" icon={Download} description="Track PDF downloads (requires setup)" isLoading={true}/>
          <StatCard title="Contact Submissions (7 Days)" value={recentSubmissionsCount ?? "..."} icon={Mail} description="New messages from contact form" isLoading={isLoadingRecentSubmissions}/>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl flex items-center"><Users className="mr-2 h-6 w-6 text-primary" />Visitor Analytics (Placeholders)</CardTitle>
          <CardDescription>Insights into your audience. (Requires dedicated analytics integration).</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-2"> {/* Changed to lg:grid-cols-2 */}
           <StatCard title="Visitors by Device" value="N/A" icon={Users} description="Mobile / Desktop / Tablet" isLoading={true}/>
           <StatCard title="Top Traffic Sources" value="N/A" icon={LinkIcon} description="e.g., GitHub, LinkedIn, Direct" isLoading={true}/>
           {/* Removed Peak Visit Hours and External Link Clicks for now to fit in 2 cols */}
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
                        <Cell key={`cell-${index}`} fill={entry.color} />
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
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Bar>
                </BarChart>
            </ResponsiveContainer>
        </CardContent>
      </Card>
      
      <Card className="shadow-sm border-yellow-500/50 dark:border-yellow-400/40 bg-yellow-50/50 dark:bg-yellow-900/10">
        <CardHeader>
            <CardTitle className="text-lg flex items-center text-yellow-700 dark:text-yellow-500"><AlertCircle className="mr-2 h-5 w-5"/>Further Implementation Notes</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-yellow-600 dark:text-yellow-400/80 space-y-2">
            <p><strong>Event Tracking Needed:</strong> "Most Interacted Skill", "Total Resume Downloads", and some "Visitor Analytics" require client-side event tracking (e.g., logging to Supabase when users click/view items on your public site).</p>
            <p><strong>Full Visitor Analytics:</strong> For comprehensive visitor analytics (device types, traffic sources, peak hours), integrating a dedicated service like Vercel Analytics, Google Analytics, or Plausible is recommended.</p>
            <p><strong>Placeholder Charts:</strong> Charts currently use placeholder data. Real data fetching and processing logic would be needed for them to be meaningful.</p>
        </CardContent>
      </Card>

    </div>
  );
}
