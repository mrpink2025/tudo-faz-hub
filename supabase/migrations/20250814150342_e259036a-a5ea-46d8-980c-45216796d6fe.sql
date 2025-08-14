-- Create telemetry events table
CREATE TABLE IF NOT EXISTS public.telemetry_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}',
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  url TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create performance metrics table
CREATE TABLE IF NOT EXISTS public.performance_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_type TEXT NOT NULL,
  value NUMERIC NOT NULL,
  labels JSONB NOT NULL DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create system health table
CREATE TABLE IF NOT EXISTS public.system_health (
  id TEXT NOT NULL PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'unknown',
  last_check TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  response_time INTEGER,
  checks JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create analytics dashboard table
CREATE TABLE IF NOT EXISTS public.analytics_dashboard (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_type TEXT NOT NULL,
  time_period TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.telemetry_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_dashboard ENABLE ROW LEVEL SECURITY;

-- Create policies for telemetry_events (admin-only access)
CREATE POLICY "Admin can view all telemetry events" 
ON public.telemetry_events 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can insert telemetry events" 
ON public.telemetry_events 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin') OR auth.uid() IS NULL);

-- Create policies for performance_metrics (admin-only access)
CREATE POLICY "Admin can view all performance metrics" 
ON public.performance_metrics 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can insert performance metrics" 
ON public.performance_metrics 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin') OR auth.uid() IS NULL);

-- Create policies for system_health (admin-only access)
CREATE POLICY "Admin can view system health" 
ON public.system_health 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update system health" 
ON public.system_health 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Create policies for analytics_dashboard (admin-only access)
CREATE POLICY "Admin can view analytics dashboard" 
ON public.analytics_dashboard 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can manage analytics dashboard" 
ON public.analytics_dashboard 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_telemetry_events_timestamp ON public.telemetry_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_events_event_type ON public.telemetry_events(event_type);
CREATE INDEX IF NOT EXISTS idx_telemetry_events_user_id ON public.telemetry_events(user_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_events_session_id ON public.telemetry_events(session_id);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON public.performance_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_type ON public.performance_metrics(metric_type);

-- Create function to clean old telemetry data (retention policy)
CREATE OR REPLACE FUNCTION public.cleanup_telemetry_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Delete telemetry events older than 90 days
  DELETE FROM public.telemetry_events 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  -- Delete performance metrics older than 30 days
  DELETE FROM public.performance_metrics 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  -- Log cleanup
  RAISE NOTICE 'Telemetry data cleanup completed at %', NOW();
END;
$$;

-- Create trigger for updated_at on system_health
CREATE TRIGGER update_system_health_updated_at
  BEFORE UPDATE ON public.system_health
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial system health record
INSERT INTO public.system_health (id, status, checks) 
VALUES ('main', 'unknown', '{"database": false, "auth": false, "storage": false, "api": false}')
ON CONFLICT (id) DO NOTHING;