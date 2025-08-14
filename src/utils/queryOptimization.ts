import { logger } from "./logger";

// Query deduplication cache
const queryCache = new Map<string, { 
  promise: Promise<any>, 
  timestamp: number,
  ttl: number 
}>();

// Cache TTL configurations (in milliseconds)
const CACHE_TTL = {
  static: 5 * 60 * 1000,      // 5 minutes for static data
  dynamic: 30 * 1000,         // 30 seconds for dynamic data
  realtime: 5 * 1000,         // 5 seconds for real-time data
  settings: 10 * 60 * 1000,   // 10 minutes for settings
} as const;

interface QueryOptions {
  ttl?: number;
  key?: string;
  enableCache?: boolean;
  forceRefresh?: boolean;
}

// Generic query optimizer with deduplication and caching
export function optimizeQuery<T>(
  queryFn: () => Promise<T>,
  options: QueryOptions = {}
): Promise<T> {
  const {
    ttl = CACHE_TTL.dynamic,
    key = generateQueryKey(queryFn.toString()),
    enableCache = true,
    forceRefresh = false
  } = options;

  if (!enableCache || forceRefresh) {
    return executeQuery(queryFn, key);
  }

  const now = Date.now();
  const cached = queryCache.get(key);

  // Return cached promise if still valid
  if (cached && (now - cached.timestamp < cached.ttl)) {
    logger.debug('Query cache hit', { key, age: now - cached.timestamp });
    return cached.promise;
  }

  // Execute new query and cache it
  const promise = executeQuery(queryFn, key);
  queryCache.set(key, { promise, timestamp: now, ttl });
  
  // Clean up expired entries
  setTimeout(() => cleanupCache(), 0);
  
  return promise;
}

async function executeQuery<T>(queryFn: () => Promise<T>, key: string): Promise<T> {
  try {
    const startTime = performance.now();
    const result = await queryFn();
    const duration = performance.now() - startTime;
    
    logger.info('Query executed', { 
      key: key.substring(0, 50) + '...', 
      duration: `${duration.toFixed(2)}ms` 
    });
    
    return result;
  } catch (error) {
    // Remove failed query from cache
    queryCache.delete(key);
    logger.error('Query failed', { key, error });
    throw error;
  }
}

function generateQueryKey(queryString: string): string {
  // Simple hash function for query key generation
  let hash = 0;
  for (let i = 0; i < queryString.length; i++) {
    const char = queryString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `query_${Math.abs(hash)}`;
}

function cleanupCache(): void {
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const [key, entry] of queryCache.entries()) {
    if (now - entry.timestamp >= entry.ttl) {
      queryCache.delete(key);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    logger.debug('Cache cleanup completed', { 
      cleaned: cleanedCount, 
      remaining: queryCache.size 
    });
  }
}

// Batch query optimizer
export class QueryBatcher {
  private batches = new Map<string, {
    queries: Array<() => Promise<any>>,
    resolvers: Array<(value: any) => void>,
    rejecters: Array<(error: any) => void>
  }>();
  
  private timeouts = new Map<string, NodeJS.Timeout>();

  add<T>(
    batchKey: string,
    queryFn: () => Promise<T>,
    delay: number = 10
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.batches.has(batchKey)) {
        this.batches.set(batchKey, {
          queries: [],
          resolvers: [],
          rejecters: []
        });
      }

      const batch = this.batches.get(batchKey)!;
      batch.queries.push(queryFn);
      batch.resolvers.push(resolve);
      batch.rejecters.push(reject);

      // Clear existing timeout
      if (this.timeouts.has(batchKey)) {
        clearTimeout(this.timeouts.get(batchKey)!);
      }

      // Set new timeout
      const timeout = setTimeout(() => {
        this.executeBatch(batchKey);
      }, delay);
      
      this.timeouts.set(batchKey, timeout);
    });
  }

  private async executeBatch(batchKey: string): Promise<void> {
    const batch = this.batches.get(batchKey);
    if (!batch) return;

    this.batches.delete(batchKey);
    this.timeouts.delete(batchKey);

    logger.info('Executing query batch', { 
      batchKey, 
      queryCount: batch.queries.length 
    });

    try {
      const results = await Promise.allSettled(
        batch.queries.map(query => query())
      );

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          batch.resolvers[index](result.value);
        } else {
          batch.rejecters[index](result.reason);
        }
      });
    } catch (error) {
      batch.rejecters.forEach(reject => reject(error));
    }
  }
}

// Global query batcher instance
export const queryBatcher = new QueryBatcher();

// Database query optimizations
export const dbOptimizations = {
  // Optimize listing queries with proper indexing hints
  listingsQuery: (filters: any = {}) => {
    const baseQuery = `
      SELECT id, title, price, currency, location, created_at, cover_image
      FROM listings 
      WHERE approved = true AND status = 'published'
    `;
    
    let query = baseQuery;
    const params: any[] = [];
    
    if (filters.category) {
      query += ` AND category_id = $${params.length + 1}`;
      params.push(filters.category);
    }
    
    if (filters.location) {
      query += ` AND location ILIKE $${params.length + 1}`;
      params.push(`%${filters.location}%`);
    }
    
    if (filters.minPrice) {
      query += ` AND price >= $${params.length + 1}`;
      params.push(filters.minPrice);
    }
    
    if (filters.maxPrice) {
      query += ` AND price <= $${params.length + 1}`;
      params.push(filters.maxPrice);
    }
    
    // Add ordering and limit
    query += ` ORDER BY ${filters.highlighted ? 'highlighted DESC, ' : ''}created_at DESC`;
    
    if (filters.limit) {
      query += ` LIMIT $${params.length + 1}`;
      params.push(filters.limit);
    }
    
    if (filters.offset) {
      query += ` OFFSET $${params.length + 1}`;
      params.push(filters.offset);
    }
    
    return { query, params };
  },

  // Suggest database indexes for better performance
  suggestedIndexes: [
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_approved_status ON listings(approved, status) WHERE approved = true AND status = \'published\';',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_category_created ON listings(category_id, created_at DESC);',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_location_gin ON listings USING gin(to_tsvector(\'portuguese\', location));',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_price_range ON listings(price) WHERE price IS NOT NULL;',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_highlighted ON listings(highlighted, created_at DESC) WHERE highlighted = true;'
  ]
};

// Memory usage monitoring
export function monitorMemoryUsage(): void {
  if (typeof window !== 'undefined' && 'memory' in performance) {
    const memory = (performance as any).memory;
    const usage = {
      used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
      total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
      limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024)
    };
    
    if (usage.used / usage.limit > 0.8) {
      logger.warn('High memory usage detected', usage);
      // Trigger cache cleanup
      cleanupCache();
    }
  }
}

// Start memory monitoring
if (typeof window !== 'undefined') {
  setInterval(monitorMemoryUsage, 30000); // Check every 30 seconds
}