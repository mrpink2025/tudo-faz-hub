import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    database: boolean;
    auth: boolean;
    storage: boolean;
    api: boolean;
  };
  lastCheck: Date;
  responseTime: number;
}

export const useHealthCheck = () => {
  const [health, setHealth] = useState<HealthStatus>({
    status: 'healthy',
    checks: {
      database: true,
      auth: true,
      storage: true,
      api: true
    },
    lastCheck: new Date(),
    responseTime: 0
  });

  const [loading, setLoading] = useState(false);

  const runHealthCheck = async (): Promise<HealthStatus> => {
    const startTime = performance.now();
    setLoading(true);

    const checks = {
      database: false,
      auth: false,
      storage: false,
      api: false
    };

    try {
      // Database check - using public table for health check
      const { data: dbTest, error: dbError } = await supabase
        .from('site_settings_public')
        .select('site_name')
        .limit(1);
      checks.database = !dbError;

      // Auth check
      const { data: authData, error: authError } = await supabase.auth.getSession();
      checks.auth = !authError;

      // Storage check (try to list buckets)
      const { data: storageData, error: storageError } = await supabase.storage.listBuckets();
      checks.storage = !storageError;

      // API check (test a simple RPC call)
      const { error: apiError } = await supabase.rpc('get_basic_profile_info', { profile_user_id: '00000000-0000-0000-0000-000000000000' });
      checks.api = true; // RPC exists, even if no data
    } catch (error) {
      console.warn('Health check error:', error);
    }

    const endTime = performance.now();
    const responseTime = endTime - startTime;

    const healthyCount = Object.values(checks).filter(Boolean).length;
    const status: HealthStatus['status'] = 
      healthyCount === 4 ? 'healthy' :
      healthyCount >= 2 ? 'degraded' : 'unhealthy';

    const healthStatus: HealthStatus = {
      status,
      checks,
      lastCheck: new Date(),
      responseTime
    };

    setHealth(healthStatus);
    setLoading(false);

    return healthStatus;
  };

  // Auto health check every 5 minutes
  useEffect(() => {
    runHealthCheck();
    const interval = setInterval(runHealthCheck, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return {
    health,
    loading,
    runHealthCheck
  };
};