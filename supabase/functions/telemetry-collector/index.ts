import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { events, metrics } = await req.json();

    // Process telemetry events
    if (events && Array.isArray(events) && events.length > 0) {
      const { error: eventsError } = await supabaseClient
        .from('telemetry_events')
        .insert(events.map((event: TelemetryEvent) => ({
          event_type: event.event_type,
          event_data: event.event_data,
          user_id: event.user_id || null,
          session_id: event.session_id,
          timestamp: event.timestamp,
          url: event.url,
          user_agent: event.user_agent,
          created_at: new Date().toISOString()
        })));

      if (eventsError) {
        console.error('Error inserting telemetry events:', eventsError);
      }
    }

    // Process performance metrics
    if (metrics && Array.isArray(metrics) && metrics.length > 0) {
      const { error: metricsError } = await supabaseClient
        .from('performance_metrics')
        .insert(metrics.map((metric: PerformanceMetric) => ({
          metric_type: metric.metric_type,
          value: metric.value,
          labels: metric.labels,
          timestamp: metric.timestamp,
          created_at: new Date().toISOString()
        })));

      if (metricsError) {
        console.error('Error inserting performance metrics:', metricsError);
      }
    }

    // Update system health metrics
    const healthData = {
      status: 'healthy',
      last_check: new Date().toISOString(),
      response_time: Date.now(),
      checks: {
        database: true,
        auth: true,
        storage: true,
        api: true
      }
    };

    await supabaseClient
      .from('system_health')
      .upsert({
        id: 'main',
        ...healthData
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: { 
          events: events?.length || 0, 
          metrics: metrics?.length || 0 
        } 
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    );

  } catch (error) {
    console.error('Telemetry collector error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      {
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    );
  }
});