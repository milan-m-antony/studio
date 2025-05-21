
"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import type { VisitorLog } from '@/types/supabase';

// Simple device detection based on screen width
const getDeviceType = (): VisitorLog['device_type'] => {
  if (typeof window === 'undefined') return 'Unknown';
  const width = window.innerWidth;
  if (width < 768) return 'Mobile';
  if (width < 1024) return 'Tablet';
  return 'Desktop';
};

export default function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Only run tracking on the client-side and not for admin paths
    if (typeof window !== 'undefined' && !pathname.startsWith('/admin') && !pathname.startsWith('/maintenance')) {
      const logVisit = async () => {
        let isTrackingEnabled = true; // Default to true
        try {
            const { data: settings, error: settingsError } = await supabase
                .from('site_settings')
                .select('is_analytics_tracking_enabled')
                .eq('id', 'global_settings')
                .maybeSingle();

            if (settingsError) {
                console.warn('VisitTracker: Error fetching site_settings:', settingsError.message);
            } else if (settings && settings.is_analytics_tracking_enabled === false) {
                isTrackingEnabled = false;
                console.log('VisitTracker: Analytics tracking is globally disabled.');
            }
        } catch (e: any) {
            console.warn('VisitTracker: Exception fetching site_settings:', e.message);
        }

        if (!isTrackingEnabled) {
            return; 
        }

        const device_type = getDeviceType();
        const path_visited = pathname;
        const user_agent_string = navigator.userAgent;
        
        console.log(`VisitTracker: Logging visit - Path: ${path_visited}, Device: ${device_type}`);

        const { error } = await supabase
          .from('visitor_logs')
          .insert([{ device_type, path_visited, user_agent_string }]);

        if (error) {
          console.warn('VisitTracker: Failed to log visit:', error.message);
        }
      };

      // Log visit once per session for a given path to reduce noise,
      // or use a more sophisticated session tracking.
      // For simplicity, we'll log every time this component mounts for a new path.
      const sessionKey = `visit_logged_${pathname}`;
      if (!sessionStorage.getItem(sessionKey)) {
        logVisit();
        sessionStorage.setItem(sessionKey, 'true');
      } else {
        // Optionally re-log if enough time has passed, or just log once per session per path
        // console.log(`VisitTracker: Visit to ${pathname} already logged this session.`);
      }
    }
  }, [pathname]); 

  return null; 
}
