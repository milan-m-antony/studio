
"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Eye, Brain, FolderKanban, LineChart, Users, Download, Mail, Link as LinkIcon, BarChart3, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, Legend as RechartsLegend } from 'recharts';
import { supabase } from '@/lib/supabaseClient'; // Import Supabase client
import { subDays, format } from 'date-fns';

// Placeholder data for charts - replace with actual data fetching
const placeholderChartData = [
  { name: 'Frontend', projects: 4, views: 2400 },
  { name: 'Backend', projects: 2, views: 1500 },
  { name: 'Mobile', projects: 1, views: 980 },
  { name: 'AI/ML', projects: 1, views: 1200 },
];

const placeholderDeviceData = [
  { name: 'Desktop', visitors: 450 },
  { name: 'Mobile', visitors: 750 },
  { name: 'Tablet', visitors: 120 },
];

const placeholderTrafficSourceData = [
    { name: 'GitHub', visitors: 300, color: '#6e5494' }, // approx GitHub purple
    { name: 'LinkedIn', visitors: 250, color: '#0077b5' }, // approx LinkedIn blue
    { name: 'Google', visitors: 400, color: '#4285F4' }, // approx Google blue
    { name: 'Direct', visitors: 150, color: '#757575' },  // grey
];


const StatCard = ({ title, value, icon: Icon, trend, description, isLoading }: { title: string; value: string | number; icon: React.ElementType; trend?: string; description: string, isLoading?: boolean }) => (
  <Card className="shadow-lg hover:shadow-xl transition-shadow">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <Icon className="h-5 w-5 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <div className="h-8 w-1/2 bg-muted animate-pulse rounded-md"></div>
      ) : (
        <div className="text-2xl font-bold">{value}</div>
      )}
      {trend && !isLoading && <p className="text-xs text-muted-foreground">{trend}</p>}
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </CardContent>
  </Card>
);

export default function DashboardOverview() {
  const [totalProjectViews, setTotalProjectViews] = useState<number | null>(null);
  const [isLoadingTotalProjectViews, setIsLoadingTotalProjectViews] = useState(true);
  const [recentSubmissionsCount, setRecentSubmissionsCount] = useState<number | null>(null);
  const [isLoadingRecentSubmissions, setIsLoadingRecentSubmissions] = useState(true);

  // Fetch Total Project Views
  useEffect(() => {
    const fetchTotalProjectViews = async () => {
      setIsLoadingTotalProjectViews(true);
      const { count, error } = await supabase
        .from('project_views')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error("Error fetching total project views:", error);
        setTotalProjectViews(0); // Default to 0 on error
      } else {
        setTotalProjectViews(count ?? 0);
      }
      setIsLoadingTotalProjectViews(false);
    };
    fetchTotalProjectViews();
  }, []);

  // Fetch Recent Contact Submissions Count (Last 7 Days)
  useEffect(() => {
    const fetchRecentSubmissions = async () => {
      setIsLoadingRecentSubmissions(true);
      const sevenDaysAgo = subDays(new Date(), 7).toISOString();
      const { count, error } = await supabase
        .from('contact_submissions')
        .select('*', { count: 'exact', head: true })
        .gte('submitted_at', sevenDaysAgo);

      if (error) {
        console.error("Error fetching recent contact submissions count:", error);
        setRecentSubmissionsCount(0);
      } else {
        setRecentSubmissionsCount(count ?? 0);
      }
      setIsLoadingRecentSubmissions(false);
    };
    fetchRecentSubmissions();
  }, []);

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Portfolio Overview</CardTitle>
          <CardDescription>A quick glance at your portfolio's engagement and activity.</CardDescription>
        </CardHeader>
      </Card>

      {/* Project & Skill Engagement Section */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl flex items-center"><FolderKanban className="mr-2 h-6 w-6 text-primary" />Project & Skill Engagement</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Project Views" value={totalProjectViews ?? "..."} icon={Eye} description="Across all projects" isLoading={isLoadingTotalProjectViews} />
          <StatCard title="Most Viewed Project" value="N/A Yet" icon={TrendingUp} description="Highest engagement" isLoading={true}/>
          <StatCard title="Most Interacted Skill" value="N/A Yet" icon={Brain} description="Based on skill page interactions" isLoading={true}/>
          <StatCard title="Project Category Popularity" value="N/A Yet" icon={BarChart3} description="Views by category" isLoading={true}/>
        </CardContent>
        <CardContent>
            {/* Placeholder for Project Category Popularity Chart */}
            <h3 className="text-lg font-semibold mb-2 text-muted-foreground">Project Views by Category (Placeholder)</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={placeholderChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip />
                <RechartsLegend />
                <Bar dataKey="views" fill="hsl(var(--primary))" name="Views" />
                <Bar dataKey="projects" fill="hsl(var(--accent))" name="Projects" />
                </BarChart>
            </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Resume & Submissions Section */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl flex items-center"><Download className="mr-2 h-6 w-6 text-primary" />Resume & Submissions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <StatCard title="Total Resume Downloads" value="N/A Yet" icon={Download} description="Total times resume PDF downloaded" isLoading={true}/>
          <StatCard title="Contact Submissions (Last 7 Days)" value={recentSubmissionsCount ?? "..."} icon={Mail} description="New messages from your contact form" isLoading={isLoadingRecentSubmissions}/>
        </CardContent>
      </Card>

      {/* Visitor Analytics Section */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl flex items-center"><Users className="mr-2 h-6 w-6 text-primary" />Visitor Analytics (Placeholders)</CardTitle>
          <CardDescription>Insights into your audience. (Requires analytics integration)</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
           <StatCard title="Visitors by Device" value="N/A" icon={Users} description="Mobile / Desktop / Tablet" isLoading={true}/>
           <StatCard title="Top Traffic Sources" value="N/A" icon={LinkIcon} description="GitHub, LinkedIn, Google, Direct" isLoading={true}/>
           <StatCard title="Peak Visit Hours" value="N/A" icon={Clock} description="Most active times" isLoading={true}/>
           <StatCard title="External Link Clicks" value="N/A" icon={TrendingUp} description="Clicks to GitHub, LinkedIn etc." isLoading={true}/>
        </CardContent>
         <CardContent>
            <h3 className="text-lg font-semibold mb-2 text-muted-foreground">Visitors by Device Type (Placeholder)</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={placeholderDeviceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <RechartsTooltip />
                <Bar dataKey="visitors" fill="hsl(var(--primary))" name="Visitors" />
                </BarChart>
            </ResponsiveContainer>
        </CardContent>
         <CardContent>
            <h3 className="text-lg font-semibold mb-2 text-muted-foreground">Top Traffic Sources (Placeholder)</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={placeholderTrafficSourceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip />
                <Bar dataKey="visitors" name="Visitors">
                    {placeholderTrafficSourceData.map((entry, index) => (
                    <rect key={`cell-${index}`} x={entry.name} y={0} width={10} height={entry.visitors} fill={entry.color} />
                    ))}
                </Bar>
                </BarChart>
            </ResponsiveContainer>
             <p className="text-xs text-muted-foreground mt-2 text-center">Note: Chart above uses placeholder data and non-functional <code className="text-xs">&lt;rect&gt;</code> elements instead of <code className="text-xs">&lt;Cell&gt;</code> for simplicity here. A proper implementation would use <code className="text-xs">&lt;Cell&gt;</code> within <code className="text-xs">&lt;Bar&gt;</code> for individual bar colors.</p>
        </CardContent>
      </Card>
      
      <Card className="shadow-md border-yellow-500/50 dark:border-yellow-400/40">
        <CardHeader>
            <CardTitle className="text-lg flex items-center text-yellow-600 dark:text-yellow-400"><AlertCircle className="mr-2 h-5 w-5"/>Further Implementation Notes</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
            <p><strong>Event Tracking Needed:</strong> Most analytics here (project views, skill interactions, resume downloads, link clicks) require client-side event tracking to be implemented. This typically involves sending data to a Supabase table (e.g., `analytics_events`) when users perform these actions.</p>
            <p><strong>Full Analytics:</strong> For comprehensive visitor analytics (device types, traffic sources, peak hours), integrating a dedicated service like Vercel Analytics, Google Analytics, or Plausible is recommended.</p>
            <p><strong>Placeholder Data:</strong> Charts currently use placeholder data. Real data fetching and processing logic would be needed for them to be meaningful.</p>
        </CardContent>
      </Card>

    </div>
  );
}

    