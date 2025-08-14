import { useState, useCallback } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { logger } from "@/utils/logger";

interface PerformanceConfig {
  enableLazyLoading: boolean;
  enableImageOptimization: boolean;
  enableQueryOptimization: boolean;
  maxCacheSize: number;
}

export function usePerformanceOptimizations(): PerformanceConfig {
  const isMobile = useIsMobile();
  
  return {
    enableLazyLoading: true,
    enableImageOptimization: true,
    enableQueryOptimization: true,
    maxCacheSize: isMobile ? 50 : 100, // Menor cache em mobile
  };
}

// Hook para medir performance de componentes
export function usePerformanceMonitor(componentName: string) {
  const [renderTime, setRenderTime] = useState<number>(0);
  
  const startMeasure = useCallback(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      setRenderTime(duration);
      
      if (duration > 100) {
        logger.warn(`Slow render detected in ${componentName}`, {
          duration: `${duration.toFixed(2)}ms`,
          component: componentName
        });
      }
    };
  }, [componentName]);
  
  return { renderTime, startMeasure };
}

// Hook para otimizar re-renders
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  return useCallback(callback, deps);
}