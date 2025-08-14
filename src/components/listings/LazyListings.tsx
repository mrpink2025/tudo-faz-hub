import { lazy } from 'react';
import { LazyWrapper } from '@/components/ui/lazy-wrapper';

// Lazy load components
const FeaturedListingsSection = lazy(() => import('./FeaturedListingsSection'));
const NearbyListingsSection = lazy(() => import('./NearbyListingsSection'));

export { FeaturedListingsSection, NearbyListingsSection };

// Enhanced FeaturedListingsBar with lazy loading
export function LazyFeaturedListingsBar() {
  return (
    <LazyWrapper name="FeaturedListingsSection" minHeight="300px">
      <FeaturedListingsSection />
    </LazyWrapper>
  );
}

export function LazyNearbyListingsSection() {
  return (
    <LazyWrapper name="NearbyListingsSection" minHeight="400px">
      <NearbyListingsSection />
    </LazyWrapper>
  );
}