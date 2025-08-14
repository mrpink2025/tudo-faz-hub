import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Download, Share, Smartphone, Wifi, WifiOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { logger } from "@/utils/logger";

interface PWAFeatures {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  hasServiceWorker: boolean;
  cacheSize: number;
}

export function PWAManager() {
  const { t } = useTranslation();
  const [pwaFeatures, setPWAFeatures] = useState<PWAFeatures>({
    isInstallable: false,
    isInstalled: false,
    isOnline: navigator.onLine,
    hasServiceWorker: 'serviceWorker' in navigator,
    cacheSize: 0
  });
  
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [offlineListings, setOfflineListings] = useState<any[]>([]);

  // Monitor PWA installation state
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setPWAFeatures(prev => ({ ...prev, isInstallable: true }));
      logger.info('PWA installable');
    };

    const handleAppInstalled = () => {
      setPWAFeatures(prev => ({ ...prev, isInstalled: true, isInstallable: false }));
      setDeferredPrompt(null);
      logger.info('PWA installed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setPWAFeatures(prev => ({ ...prev, isOnline: true }));
      logger.info('App back online');
    };

    const handleOffline = () => {
      setPWAFeatures(prev => ({ ...prev, isOnline: false }));
      logger.warn('App went offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check if app is already installed
  useEffect(() => {
    const checkInstallation = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isIOSInstalled = isIOS && (window.navigator as any).standalone;
      
      setPWAFeatures(prev => ({ 
        ...prev, 
        isInstalled: isStandalone || isIOSInstalled 
      }));
    };

    checkInstallation();
  }, []);

  // Load offline listings from cache
  useEffect(() => {
    const loadOfflineData = async () => {
      try {
        const cached = localStorage.getItem('tudofaz-offline-listings');
        if (cached) {
          const listings = JSON.parse(cached);
          setOfflineListings(listings);
          setPWAFeatures(prev => ({ 
            ...prev, 
            cacheSize: new Blob([cached]).size 
          }));
        }
      } catch (error) {
        logger.error('Error loading offline data', { error });
      }
    };

    loadOfflineData();
  }, []);

  // Install PWA
  const installPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        logger.info('PWA installation accepted');
      } else {
        logger.info('PWA installation declined');
      }
      
      setDeferredPrompt(null);
    }
  };

  // Share app
  const shareApp = async () => {
    const shareData = {
      title: 'TudoFaz - Marketplace Local',
      text: 'Descubra anúncios e serviços na sua região',
      url: window.location.origin
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        logger.info('App shared via native share');
      } else {
        await navigator.clipboard.writeText(window.location.origin);
        logger.info('URL copied to clipboard');
      }
    } catch (error) {
      logger.error('Error sharing app', { error });
    }
  };

  // Clear cache
  const clearCache = async () => {
    try {
      // Clear localStorage cache
      localStorage.removeItem('tudofaz-offline-listings');
      setOfflineListings([]);
      
      // Clear service worker cache if available
      if ('serviceWorker' in navigator && 'caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }
      
      setPWAFeatures(prev => ({ ...prev, cacheSize: 0 }));
      logger.info('Cache cleared');
    } catch (error) {
      logger.error('Error clearing cache', { error });
    }
  };

  // Update cache with current listings (mock function)
  const updateOfflineCache = () => {
    // In a real implementation, this would fetch current listings
    const mockListings = [
      { id: '1', title: 'iPhone 14 Pro', price: 3500, currency: 'BRL', cached_at: new Date().toISOString() },
      { id: '2', title: 'Apartamento 2 quartos', price: 250000, currency: 'BRL', cached_at: new Date().toISOString() }
    ];
    
    localStorage.setItem('tudofaz-offline-listings', JSON.stringify(mockListings));
    setOfflineListings(mockListings);
    setPWAFeatures(prev => ({ 
      ...prev, 
      cacheSize: new Blob([JSON.stringify(mockListings)]).size 
    }));
    
    logger.info('Offline cache updated', { count: mockListings.length });
  };

  const formatCacheSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="w-5 h-5" />
          Aplicativo Móvel (PWA)
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Installation Status */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div>
            <p className="font-medium text-sm">Status da Instalação</p>
            <p className="text-xs text-muted-foreground">
              {pwaFeatures.isInstalled 
                ? 'App instalado como PWA' 
                : pwaFeatures.isInstallable 
                  ? 'Disponível para instalação'
                  : 'Não disponível para instalação'
              }
            </p>
          </div>
          <Badge variant={pwaFeatures.isInstalled ? 'default' : 'secondary'}>
            {pwaFeatures.isInstalled ? 'Instalado' : 'Web App'}
          </Badge>
        </div>

        {/* Online Status */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            {pwaFeatures.isOnline ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" />
            )}
            <div>
              <p className="font-medium text-sm">
                {pwaFeatures.isOnline ? 'Online' : 'Offline'}
              </p>
              <p className="text-xs text-muted-foreground">
                {pwaFeatures.isOnline 
                  ? 'Todos os recursos disponíveis'
                  : `${offlineListings.length} anúncios em cache`
                }
              </p>
            </div>
          </div>
        </div>

        {/* Cache Information */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Cache Offline</Label>
            <span className="text-xs text-muted-foreground">
              {formatCacheSize(pwaFeatures.cacheSize)}
            </span>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={updateOfflineCache}
              variant="outline" 
              size="sm"
              className="flex-1"
            >
              Atualizar Cache
            </Button>
            <Button 
              onClick={clearCache}
              variant="outline" 
              size="sm"
              className="flex-1"
            >
              Limpar Cache
            </Button>
          </div>
        </div>

        {/* Offline Listings Preview */}
        {offlineListings.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm">Anúncios Offline ({offlineListings.length})</Label>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {offlineListings.slice(0, 3).map((listing) => (
                <div key={listing.id} className="text-xs p-2 bg-muted/30 rounded">
                  <p className="font-medium">{listing.title}</p>
                  <p className="text-muted-foreground">
                    {listing.currency} {listing.price?.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2 pt-2 border-t">
          {pwaFeatures.isInstallable && !pwaFeatures.isInstalled && (
            <Button 
              onClick={installPWA}
              className="w-full"
              size="sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Instalar App
            </Button>
          )}
          
          <Button 
            onClick={shareApp}
            variant="outline"
            className="w-full"
            size="sm"
          >
            <Share className="w-4 h-4 mr-2" />
            Compartilhar App
          </Button>
        </div>

        {/* Features List */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>✓ Funciona offline</p>
          <p>✓ Instalável como app nativo</p>
          <p>✓ Notificações push</p>
          <p>✓ Acesso rápido</p>
        </div>
      </CardContent>
    </Card>
  );
}