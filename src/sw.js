// Enhanced Service Worker com Atualização Automática
const APP_VERSION = '2.2.0';
const CACHE_NAME = `tudofaz-v${APP_VERSION}-${Date.now()}`;
const STATIC_CACHE = `tudofaz-static-v${APP_VERSION}`;
const DYNAMIC_CACHE = `tudofaz-dynamic-v${APP_VERSION}`;
const API_CACHE = `tudofaz-api-v${APP_VERSION}`;

// Cache strategies configuration
const CACHE_STRATEGIES = {
  static: {
    name: STATIC_CACHE,
    maxAge: 1 * 60 * 60 * 1000, // 1 hour
    maxEntries: 60
  },
  dynamic: {
    name: DYNAMIC_CACHE,
    maxAge: 10 * 60 * 1000, // 10 minutes
    maxEntries: 100
  },
  api: {
    name: API_CACHE,
    maxAge: 2 * 60 * 1000, // 2 minutes (mais agressivo para atualizações)
    maxEntries: 50
  }
};

// URLs to cache on install
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/lovable-uploads/6f5f4a0d-1623-414f-8740-4490d8c09adb.png'
];

// URL patterns for different cache strategies
const CACHE_PATTERNS = {
  static: [
    /\.(js|css|woff|woff2|ttf|eot)$/,
    /\/(manifest\.json|favicon\.ico)$/
  ],
  images: [
    /\.(png|jpg|jpeg|gif|webp|svg|ico)$/,
    /\/storage\/.*\.(png|jpg|jpeg|gif|webp)$/,
    /\/lovable-uploads\//
  ],
  api: [
    /\/rest\/v1\//,
    /\/storage\/v1\//,
    /\/functions\/v1\//
  ]
};

let isUpdating = false;

// Install event - cache static assets e forçar ativação
self.addEventListener('install', event => {
  console.log(`[SW] Instalando Service Worker v${APP_VERSION}...`);
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Fazendo cache dos recursos estáticos');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Service worker instalado com sucesso');
        // Forçar ativação imediata da nova versão
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[SW] Falha na instalação:', error);
      })
  );
});

// Activate event - limpar caches antigos e reivindicar controle
self.addEventListener('activate', event => {
  console.log(`[SW] Ativando Service Worker v${APP_VERSION}...`);
  
  event.waitUntil(
    Promise.all([
      // Limpar caches antigos
      caches.keys().then(cacheNames => {
        const currentCaches = [STATIC_CACHE, DYNAMIC_CACHE, API_CACHE, CACHE_NAME];
        
        return Promise.all(
          cacheNames.map(cacheName => {
            if (!currentCaches.includes(cacheName) && cacheName.startsWith('tudofaz-')) {
              console.log('[SW] Removendo cache antigo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Reivindicar controle de todas as abas imediatamente
      self.clients.claim().then(() => {
        console.log('[SW] Service worker ativo em todas as abas');
        
        // Notificar todas as abas sobre a atualização
        return self.clients.matchAll();
      }).then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_UPDATED',
            version: APP_VERSION,
            message: 'App atualizado automaticamente!'
          });
        });
      })
    ])
  );
});

// Verificação periódica de atualizações
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CHECK_UPDATE') {
    console.log('[SW] Verificando atualizações...');
    
    // Simular verificação de nova versão
    fetch('/manifest.json', { cache: 'no-cache' })
      .then(response => response.json())
      .then(manifest => {
        const hasUpdate = manifest.version !== APP_VERSION;
        
        event.ports[0].postMessage({
          type: 'UPDATE_CHECK_RESULT',
          hasUpdate,
          currentVersion: APP_VERSION,
          newVersion: manifest.version || 'latest'
        });
        
        if (hasUpdate && !isUpdating) {
          isUpdating = true;
          
          // Forçar atualização do service worker
          self.registration.update().then(() => {
            console.log('[SW] Atualização forçada iniciada');
          });
        }
      })
      .catch(() => {
        event.ports[0].postMessage({
          type: 'UPDATE_CHECK_RESULT',
          hasUpdate: false,
          error: 'Erro ao verificar atualizações'
        });
      });
  }
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Forçando atualização imediata');
    self.skipWaiting();
  }
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
    
    // Strategy 3: API calls - Network First com cache mais agressivo
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
      // Buscar em background para próxima vez
      fetch(request).then(response => {
        if (response.ok) {
          const responseClone = response.clone();
          responseClone.headers.append('sw-cache-time', Date.now().toString());
          putInCache(cache, request, responseClone, strategy);
        }
      }).catch(() => {});
      
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
    const response = await fetch(request, { cache: 'no-cache' });
    if (response.ok) {
      const responseClone = response.clone();
      responseClone.headers.append('sw-cache-time', Date.now().toString());
      await putInCache(cache, request, responseClone, strategy);
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) {
      console.log('[SW] Usando versão em cache para:', request.url);
      return cached;
    }
    throw error;
  }
}

async function staleWhileRevalidate(request, strategy) {
  const cache = await caches.open(strategy.name);
  const cached = await cache.match(request);
  
  const fetchPromise = fetch(request, { cache: 'no-cache' }).then(response => {
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
  
  // Para páginas HTML, retornar página offline
  if (request.destination === 'document') {
    const offlineCache = await caches.open(STATIC_CACHE);
    const offlinePage = await offlineCache.match('/');
    if (offlinePage) return offlinePage;
  }
  
  return createErrorResponse();
}

function createErrorResponse() {
  return new Response('App offline - Verifique sua conexão', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
}

// Push notifications para mobile
self.addEventListener('push', event => {
  console.log('[SW] Notificação push recebida');
  
  let notificationData = {
    title: 'TudoFaz Hub',
    body: 'Nova notificação',
    icon: '/lovable-uploads/6f5f4a0d-1623-414f-8740-4490d8c09adb.png',
    badge: '/lovable-uploads/6f5f4a0d-1623-414f-8740-4490d8c09adb.png'
  };
  
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (e) {
      notificationData.body = event.data.text() || notificationData.body;
    }
  }
  
  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    vibrate: [200, 100, 200],
    data: notificationData.data || {},
    actions: [
      {
        action: 'open',
        title: 'Abrir App',
        icon: notificationData.icon
      },
      {
        action: 'close',
        title: 'Fechar'
      }
    ],
    requireInteraction: true,
    silent: false
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// Lidar com cliques em notificações
self.addEventListener('notificationclick', event => {
  console.log('[SW] Clique em notificação:', event.action);
  
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      // Se já há uma janela aberta, focar nela
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Se não há janela aberta, abrir uma nova
      if (clients.openWindow) {
        const url = event.notification.data?.url || '/';
        return clients.openWindow(url);
      }
    })
  );
});

console.log(`[SW] Service Worker v${APP_VERSION} carregado e pronto para atualizações automáticas`);

// Auto-update check a cada 30 segundos quando ativo
let updateCheckInterval;

self.addEventListener('activate', () => {
  // Configurar verificação automática de atualizações
  updateCheckInterval = setInterval(() => {
    if (!isUpdating) {
      self.registration.update().catch(() => {});
    }
  }, 30000); // 30 segundos
});

// Limpar interval quando service worker for terminado
self.addEventListener('beforeunload', () => {
  if (updateCheckInterval) {
    clearInterval(updateCheckInterval);
  }
});