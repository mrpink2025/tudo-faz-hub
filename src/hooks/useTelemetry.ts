import { useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TelemetryEvent {
  event_type: string;
  event_data: Record<string, any>;
  user_id?: string;
  session_id: string;
  timestamp: string;
  url: string;
  user_agent: string;
}

interface PerformanceMetric {
  metric_type: string;
  value: number;
  labels: Record<string, string>;
  timestamp: string;
}

export const useTelemetry = () => {
  const sessionId = sessionStorage.getItem('session_id') || 
    (() => {
      const id = crypto.randomUUID();
      sessionStorage.setItem('session_id', id);
      return id;
    })();

  const trackEvent = useCallback(async (eventType: string, eventData: Record<string, any> = {}) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const telemetryEvent: TelemetryEvent = {
        event_type: eventType,
        event_data: eventData,
        user_id: user?.id,
        session_id: sessionId,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        user_agent: navigator.userAgent
      };

      // Store locally for batching
      const events = JSON.parse(localStorage.getItem('telemetry_events') || '[]');
      events.push(telemetryEvent);
      localStorage.setItem('telemetry_events', JSON.stringify(events));

      // Send immediately for critical events
      if (['error', 'page_load', 'user_action'].includes(eventType)) {
        await sendTelemetryBatch();
      }
    } catch (error) {
      console.warn('Failed to track event:', error);
    }
  }, [sessionId]);

  const trackPerformance = useCallback(async (metricType: string, value: number, labels: Record<string, string> = {}) => {
    try {
      const metric: PerformanceMetric = {
        metric_type: metricType,
        value,
        labels: {
          ...labels,
          session_id: sessionId,
          url: window.location.pathname
        },
        timestamp: new Date().toISOString()
      };

      // Store locally for batching
      const metrics = JSON.parse(localStorage.getItem('performance_metrics') || '[]');
      metrics.push(metric);
      localStorage.setItem('performance_metrics', JSON.stringify(metrics));
    } catch (error) {
      console.warn('Failed to track performance metric:', error);
    }
  }, [sessionId]);

  const trackError = useCallback(async (error: Error, context: Record<string, any> = {}) => {
    await trackEvent('error', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    });
  }, [trackEvent]);

  const sendTelemetryBatch = useCallback(async () => {
    try {
      const events = JSON.parse(localStorage.getItem('telemetry_events') || '[]');
      const metrics = JSON.parse(localStorage.getItem('performance_metrics') || '[]');

      if (events.length === 0 && metrics.length === 0) return;

      // Send to Supabase edge function for processing
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL || 'https://jprmzutdujnufjyvxtss.supabase.co'}/functions/v1/telemetry-collector`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impwcm16dXRkdWpudWZqeXZ4dHNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5Mzc0MDMsImV4cCI6MjA3MDUxMzQwM30.oLRzf4v6IJvWuulfoZVwya6T8AUEWmN2pQNs6kZ4Qhc'}`
        },
        body: JSON.stringify({
          events,
          metrics
        })
      });

      if (response.ok) {
        localStorage.removeItem('telemetry_events');
        localStorage.removeItem('performance_metrics');
      }
    } catch (error) {
      console.warn('Failed to send telemetry batch:', error);
    }
  }, []);

  // Auto-send batch every 30 seconds
  useEffect(() => {
    const interval = setInterval(sendTelemetryBatch, 30000);
    return () => clearInterval(interval);
  }, [sendTelemetryBatch]);

  // Send on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      navigator.sendBeacon(
        `${import.meta.env.VITE_SUPABASE_URL || 'https://jprmzutdujnufjyvxtss.supabase.co'}/functions/v1/telemetry-collector`,
        JSON.stringify({
          events: JSON.parse(localStorage.getItem('telemetry_events') || '[]'),
          metrics: JSON.parse(localStorage.getItem('performance_metrics') || '[]')
        })
      );
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return {
    trackEvent,
    trackPerformance,
    trackError,
    sendTelemetryBatch
  };
};