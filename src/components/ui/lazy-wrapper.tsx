import React, { Suspense, lazy } from 'react';
import ErrorBoundary from './error-boundary';
import { Skeleton } from './skeleton';
import { logger } from '@/utils/logger';

interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  name?: string;
  className?: string;
  minHeight?: string;
}

export function LazyWrapper({ 
  children, 
  fallback, 
  name = 'Component',
  className,
  minHeight = '200px'
}: LazyWrapperProps) {
  const defaultFallback = (
    <div className={className} style={{ minHeight }}>
      <Skeleton className="w-full h-full" />
    </div>
  );

  return (
    <ErrorBoundary>
      <Suspense fallback={fallback || defaultFallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

// HOC para lazy loading de componentes
export function withLazyLoading<P extends Record<string, any>>(
  Component: React.ComponentType<P>,
  name?: string
) {
  const LazyComponent = lazy(() => 
    Promise.resolve({ default: Component }).then(module => {
      logger.info(`Lazy component loaded: ${name || Component.name}`);
      return module;
    })
  );

  const WrappedComponent = React.forwardRef<any, P>((props, ref) => (
    <LazyWrapper name={name || Component.name}>
      <LazyComponent {...props} ref={ref} />
    </LazyWrapper>
  ));

  WrappedComponent.displayName = `withLazyLoading(${name || Component.name})`;
  
  return WrappedComponent;
}

// Hook para lazy loading baseado em viewport
export function useLazyLoading(options = { threshold: 0.1, rootMargin: '50px' }) {
  const [isVisible, setIsVisible] = React.useState(false);
  const [hasLoaded, setHasLoaded] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsVisible(true);
          setHasLoaded(true);
          observer.unobserve(element);
          
          logger.info('Lazy component entered viewport', {
            target: element.className || 'unknown'
          });
        }
      },
      options
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [hasLoaded, options]);

  return { ref, isVisible, hasLoaded };
}

// Componente para lazy loading com intersection observer
interface LazyLoadProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
  minHeight?: string;
  threshold?: number;
  rootMargin?: string;
}

export function LazyLoad({ 
  children, 
  fallback, 
  className,
  minHeight = '200px',
  threshold = 0.1,
  rootMargin = '50px'
}: LazyLoadProps) {
  const { ref, isVisible } = useLazyLoading({ threshold, rootMargin });

  const defaultFallback = (
    <div className={className} style={{ minHeight }}>
      <Skeleton className="w-full h-full" />
    </div>
  );

  return (
    <div ref={ref} className={className} style={{ minHeight }}>
      {isVisible ? children : (fallback || defaultFallback)}
    </div>
  );
}