
"use server";

import { supabase } from '@/lib/supabaseClient';
import SectionWrapper from '@/components/ui/SectionWrapper';
import SectionTitle from '@/components/ui/SectionTitle';
import TimelineItem from '@/components/ui/TimelineItem';
import type { TimelineEvent } from '@/types/supabase';

async function getTimelineEvents(): Promise<TimelineEvent[]> {
  const { data, error, status, statusText } = await supabase
    .from('timeline_events')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    let errorMessage = 'Error fetching timeline events. ';
    // Attempt to extract more specific Supabase error properties
    if (typeof error === 'object' && error !== null) {
      const supabaseError = error as { message?: string; details?: string; hint?: string; code?: string };
      errorMessage += `Message: ${supabaseError.message || 'N/A'}, Details: ${supabaseError.details || 'N/A'}, Hint: ${supabaseError.hint || 'N/A'}, Code: ${supabaseError.code || 'N/A'}. `;
    } else {
      // Fallback for non-object errors or if properties are missing
      try {
        errorMessage += `Received error: ${JSON.stringify(error)}. `;
      } catch (e) {
        errorMessage += `Received non-serializable error. `;
      }
    }
    errorMessage += `Status: ${status || 'N/A'} ${statusText || 'N/A'}.`;
    console.error(errorMessage);
    // For more verbose logging if the above is still just '{}':
    // console.error("Full Supabase error object:", error); 
    return [];
  }

  if (!data) {
    console.warn('No data returned for timeline events, and no explicit Supabase error. This might be an RLS issue, an empty table, or incorrect table name. Status:', status, statusText);
    return [];
  }

  if (!Array.isArray(data)) {
    console.error('Timeline events data from Supabase is not an array. Received:', data);
    return [];
  }

  return data.map(event => {
    // Basic validation for required fields from the DB row
    if (!event.id || !event.date || !event.title || !event.description || !event.icon_name || !event.type) {
        console.warn('Skipping timeline event due to missing required fields:', event);
        return null; // Will be filtered out later
    }
    return {
        id: event.id,
        date: event.date,
        title: event.title,
        description: event.description,
        iconName: event.icon_name,
        type: event.type as TimelineEvent['type'],
        sort_order: event.sort_order,
    };
  }).filter(event => event !== null) as TimelineEvent[]; // Filter out nulls and assert type
}


export default async function TimelineSection() {
  const timelineEvents = await getTimelineEvents();

  if (!timelineEvents || timelineEvents.length === 0) {
    return (
      <SectionWrapper id="timeline" className="bg-background section-fade-in" style={{ animationDelay: '0.8s' }}>
        <SectionTitle subtitle="Follow my professional and educational path.">
          My Career Journey
        </SectionTitle>
        <p className="text-center text-muted-foreground">No timeline events to display. Please check Supabase connection, RLS policies, table name ('timeline_events'), and ensure the table contains data.</p>
      </SectionWrapper>
    );
  }

  return (
    <SectionWrapper id="timeline" className="bg-background section-fade-in" style={{ animationDelay: '0.8s' }}>
      <SectionTitle subtitle="Follow my professional and educational path, highlighting key experiences and achievements along the way.">
        My Career Journey
      </SectionTitle>
      <div className="relative wrap overflow-hidden p-2 md:p-10 h-full">
        <div className="absolute border-opacity-20 border-border h-full border" style={{ left: '50%' }}></div>
        {timelineEvents.map((event, index) => (
          <div key={event.id}>
            <TimelineItem event={event} isLeft={index % 2 !== 0} />
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}

