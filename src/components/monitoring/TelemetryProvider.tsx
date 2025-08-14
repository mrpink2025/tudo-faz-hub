import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useTelemetry } from '@/hooks/useTelemetry';
import { useAnalytics } from '@/hooks/useAnalytics';

interface TelemetryContextType {
  trackEvent: (eventType: string, eventData?: Record<string, any>) => Promise<void>;
  trackPerformance: (metricType: string, value: number, labels?: Record<string, string>) => Promise<void>;
  trackError: (error: Error, context?: Record<string, any>) => Promise<void>;
  trackUserAction: (action: string, properties?: Record<string, any>) => void;
  trackConversion: (conversionType: string, value?: number, properties?: Record<string, any>) => void;
}

const TelemetryContext = createContext<TelemetryContextType | undefined>(undefined);

interface TelemetryProviderProps {
  children: ReactNode;
}

export const TelemetryProvider = ({ children }: TelemetryProviderProps) => {
  const { trackEvent, trackPerformance, trackError } = useTelemetry();
  const { trackUserAction, trackConversion } = useAnalytics();

  // Global error handler
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      trackError(new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        type: 'javascript_error'
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      trackError(new Error(event.reason), {
        type: 'unhandled_promise_rejection'
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [trackError]);

  // Track performance metrics
  useEffect(() => {
    // Track initial page load
    if (document.readyState === 'complete') {
      trackPerformance('page_load_complete', performance.now(), {
        url: window.location.pathname
      });
    } else {
      const handleLoad = () => {
        trackPerformance('page_load_complete', performance.now(), {
          url: window.location.pathname
        });
      };
      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }
  }, [trackPerformance]);

  const value: TelemetryContextType = {
    trackEvent,
    trackPerformance,
    trackError,
    trackUserAction,
    trackConversion
  };

  return (
    <TelemetryContext.Provider value={value}>
      {children}
    </TelemetryContext.Provider>
  );
};

export const useTelemetryContext = () => {
  const context = useContext(TelemetryContext);
  if (context === undefined) {
    throw new Error('useTelemetryContext must be used within a TelemetryProvider');
  }
  return context;
};