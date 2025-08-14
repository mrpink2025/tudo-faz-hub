import { useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTelemetry } from './useTelemetry';

interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
  custom_properties?: Record<string, any>;
}

export const useAnalytics = () => {
  const { trackEvent, trackPerformance } = useTelemetry();
  const location = useLocation();

  // Track page views
  useEffect(() => {
    trackEvent('page_view', {
      page: location.pathname,
      search: location.search,
      referrer: document.referrer,
      timestamp: new Date().toISOString()
    });
  }, [location, trackEvent]);

  // Track user interactions
  const trackUserAction = useCallback((action: string, properties: Record<string, any> = {}) => {
    trackEvent('user_action', {
      action,
      page: location.pathname,
      ...properties,
      timestamp: new Date().toISOString()
    });
  }, [trackEvent, location.pathname]);

  // Track business events
  const trackBusinessEvent = useCallback((event: AnalyticsEvent) => {
    trackEvent('business_event', {
      ...event,
      page: location.pathname,
      timestamp: new Date().toISOString()
    });
  }, [trackEvent, location.pathname]);

  // Track conversion events
  const trackConversion = useCallback((conversionType: string, value?: number, properties: Record<string, any> = {}) => {
    trackEvent('conversion', {
      conversion_type: conversionType,
      value,
      page: location.pathname,
      ...properties,
      timestamp: new Date().toISOString()
    });
  }, [trackEvent, location.pathname]);

  // Track performance metrics
  const trackPageLoad = useCallback(() => {
    // Track Core Web Vitals
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            trackPerformance('page_load_time', navEntry.loadEventEnd - navEntry.fetchStart, {
              page: location.pathname,
              type: 'navigation'
            });
          }
          
          if (entry.entryType === 'largest-contentful-paint') {
            trackPerformance('lcp', entry.startTime, {
              page: location.pathname,
              type: 'web_vital'
            });
          }
          
          if (entry.entryType === 'first-input') {
            const fidEntry = entry as PerformanceEventTiming;
            trackPerformance('fid', fidEntry.processingStart - fidEntry.startTime, {
              page: location.pathname,
              type: 'web_vital'
            });
          }
        }
      });

      observer.observe({ entryTypes: ['navigation', 'largest-contentful-paint', 'first-input'] });
      
      return () => observer.disconnect();
    }
  }, [trackPerformance, location.pathname]);

  // Track search events
  const trackSearch = useCallback((query: string, results: number, filters?: Record<string, any>) => {
    trackBusinessEvent({
      action: 'search',
      category: 'engagement',
      label: query,
      value: results,
      custom_properties: {
        query,
        results_count: results,
        filters
      }
    });
  }, [trackBusinessEvent]);

  // Track listing interactions
  const trackListingInteraction = useCallback((action: string, listingId: string, properties: Record<string, any> = {}) => {
    trackBusinessEvent({
      action,
      category: 'listing',
      label: listingId,
      custom_properties: {
        listing_id: listingId,
        ...properties
      }
    });
  }, [trackBusinessEvent]);

  // Track messaging events
  const trackMessage = useCallback((action: 'sent' | 'received' | 'opened', conversationId?: string) => {
    trackBusinessEvent({
      action: `message_${action}`,
      category: 'communication',
      label: conversationId,
      custom_properties: {
        conversation_id: conversationId
      }
    });
  }, [trackBusinessEvent]);

  // Track auth events
  const trackAuth = useCallback((action: 'login' | 'logout' | 'signup', method?: string) => {
    trackBusinessEvent({
      action: `auth_${action}`,
      category: 'authentication',
      label: method,
      custom_properties: {
        auth_method: method
      }
    });
  }, [trackBusinessEvent]);

  useEffect(() => {
    const cleanup = trackPageLoad();
    return cleanup;
  }, [trackPageLoad]);

  return {
    trackUserAction,
    trackBusinessEvent,
    trackConversion,
    trackSearch,
    trackListingInteraction,
    trackMessage,
    trackAuth
  };
};