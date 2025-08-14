// Enhanced Service Worker with Smart Caching Strategy
const CACHE_NAME = 'tudofaz-v2.0';
const STATIC_CACHE = 'tudofaz-static-v2.0';
const DYNAMIC_CACHE = 'tudofaz-dynamic-v2.0';
const API_CACHE = 'tudofaz-api-v2.0';

// Cache strategies configuration
const CACHE_STRATEGIES = {
  static: {
    name: STATIC_CACHE,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    maxEntries: 60
  },
  dynamic: {
    name: DYNAMIC_CACHE,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    maxEntries: 100
  },
  api: {
    name: API_CACHE,
    maxAge: 5 * 60 * 1000, // 5 minutes
    maxEntries: 50
  }
};

// URLs to cache on install
const STATIC_ASSETS = [
  '/',
  '/manifest.json'
];

// URL patterns for different cache strategies
const CACHE_PATTERNS = {
  static: [
    /\.(js|css|woff|woff2|ttf|eot)$/,
    /\/(manifest\.json|favicon\.ico)$/
  ],
  images: [
    /\.(png|jpg|jpeg|gif|webp|svg|ico)$/,
    /\/storage\/.*\.(png|jpg|jpeg|gif|webp)$/
  ],
  api: [
    /\/rest\/v1\//,
    /\/storage\/v1\//
  ]
};

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Service worker installed successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[SW] Installation failed:', error);
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        const validCaches = Object.values(CACHE_STRATEGIES).map(s => s.name);
        validCaches.push(CACHE_NAME);
        
        return Promise.all(
          cacheNames.map(cacheName => {
            if (!validCaches.includes(cacheName)) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip chrome-extension and other protocols
  if (!url.protocol.startsWith('http')) return;

  event.respondWith(handleRequest(request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Strategy 1: Static assets - Cache First
    if (isStaticAsset(url)) {
      return await cacheFirst(request, CACHE_STRATEGIES.static);
    }
    
    // Strategy 2: Images - Cache First with fallback
    if (isImage(url)) {
      return await cacheFirst(request, CACHE_STRATEGIES.dynamic);
    }
    
    // Strategy 3: API calls - Network First with cache fallback
    if (isApiCall(url)) {
      return await networkFirst(request, CACHE_STRATEGIES.api);
    }
    
    // Strategy 4: HTML pages - Stale While Revalidate
    if (request.destination === 'document') {
      return await staleWhileRevalidate(request, CACHE_STRATEGIES.dynamic);
    }
    
    // Default: Network only
    return await fetch(request);
    
  } catch (error) {
    console.error('[SW] Request failed:', error);
    return await handleOffline(request);
  }
}

// Cache strategies implementation
async function cacheFirst(request, strategy) {
  const cache = await caches.open(strategy.name);
  const cached = await cache.match(request);
  
  if (cached) {
    // Check if cached response is still fresh
    const cacheTime = cached.headers.get('sw-cache-time');
    if (cacheTime && Date.now() - parseInt(cacheTime) < strategy.maxAge) {
      return cached;
    }
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      const responseClone = response.clone();
      responseClone.headers.append('sw-cache-time', Date.now().toString());
      await putInCache(cache, request, responseClone, strategy);
    }
    return response;
  } catch (error) {
    return cached || createErrorResponse();
  }
}

async function networkFirst(request, strategy) {
  const cache = await caches.open(strategy.name);
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      const responseClone = response.clone();
      responseClone.headers.append('sw-cache-time', Date.now().toString());
      await putInCache(cache, request, responseClone, strategy);
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) {
      const cacheTime = cached.headers.get('sw-cache-time');
      if (!cacheTime || Date.now() - parseInt(cacheTime) < strategy.maxAge) {
        return cached;
      }
    }
    throw error;
  }
}

async function staleWhileRevalidate(request, strategy) {
  const cache = await caches.open(strategy.name);
  const cached = await cache.match(request);
  
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      const responseClone = response.clone();
      responseClone.headers.append('sw-cache-time', Date.now().toString());
      putInCache(cache, request, responseClone, strategy);
    }
    return response;
  }).catch(() => null);
  
  return cached || await fetchPromise || createErrorResponse();
}

// Cache management utilities
async function putInCache(cache, request, response, strategy) {
  const keys = await cache.keys();
  if (keys.length >= strategy.maxEntries) {
    const oldestKey = keys[0];
    await cache.delete(oldestKey);
  }
  
  await cache.put(request, response);
}

// URL pattern matching
function isStaticAsset(url) {
  return CACHE_PATTERNS.static.some(pattern => pattern.test(url.pathname));
}

function isImage(url) {
  return CACHE_PATTERNS.images.some(pattern => pattern.test(url.pathname));
}

function isApiCall(url) {
  return CACHE_PATTERNS.api.some(pattern => pattern.test(url.pathname)) ||
         url.hostname.includes('supabase.co');
}

// Offline handling
async function handleOffline(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  
  return createErrorResponse();
}

function createErrorResponse() {
  return new Response('Offline - No cached version available', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: { 'Content-Type': 'text/plain' }
  });
}

console.log('[SW] Service worker script loaded');