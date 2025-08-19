import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Smartphone, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Capacitor } from '@capacitor/core';
import { useTranslation } from 'react-i18next';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    // Verificar se já está instalado como PWA
    const checkIfInstalled = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
                              (window.navigator as any).standalone ||
                              document.referrer.includes('android-app://');
      
      setIsStandalone(isStandaloneMode);
      setIsInstalled(isStandaloneMode);
      
      // Se já está instalado, não mostrar prompt
      if (isStandaloneMode) {
        setShowInstallPrompt(false);
        return;
      }
    };

    checkIfInstalled();

    // Listener para o evento de instalação
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const installEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(installEvent);
      
      // Mostrar prompt personalizado após 3 segundos
      setTimeout(() => {
        if (!isInstalled && !Capacitor.isNativePlatform()) {
          setShowInstallPrompt(true);
        }
      }, 3000);
    };

    // Listener para quando o app é instalado
    const handleAppInstalled = () => {
      console.log('PWA foi instalado');
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      
      toast({
        title: t('pwa.app_installed_title'),
        description: t('pwa.app_installed_description'),
        duration: 5000,
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Verificar se não mostrou o prompt recentemente
    const lastPromptTime = localStorage.getItem('pwa-install-prompt-time');
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000; // 24 horas

    if (!lastPromptTime || (now - parseInt(lastPromptTime)) > oneDay) {
      // Mostrar prompt se não é nativo e não está instalado
      if (!Capacitor.isNativePlatform() && !isInstalled) {
        setTimeout(() => {
          setShowInstallPrompt(true);
        }, 5000); // 5 segundos após carregar
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstalled, toast]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          console.log('Usuário aceitou instalação');
        } else {
          console.log('Usuário recusou instalação');
          // Salvar que o usuário recusou para não incomodar por 24h
          localStorage.setItem('pwa-install-prompt-time', Date.now().toString());
        }
        
        setDeferredPrompt(null);
        setShowInstallPrompt(false);
      } catch (error) {
        console.error('Erro ao tentar instalar:', error);
        showManualInstallInstructions();
      }
    } else {
      showManualInstallInstructions();
    }
  };

  const showManualInstallInstructions = () => {
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isChrome = /Chrome/i.test(navigator.userAgent);
    const isFirefox = /Firefox/i.test(navigator.userAgent);
    
    let instructions = t('pwa.install_instructions_intro');
    
    if (isAndroid && isChrome) {
      instructions += t('pwa.install_android_chrome');
    } else if (isAndroid && isFirefox) {
      instructions += t('pwa.install_android_firefox');
    } else if (isAndroid) {
      instructions += t('pwa.install_android_general');
    } else {
      instructions += t('pwa.install_desktop');
    }

    toast({
      title: t('pwa.install_instructions_title'),
      description: instructions,
      duration: 10000,
    });
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // Salvar timestamp para não mostrar novamente por 24h
    localStorage.setItem('pwa-install-prompt-time', Date.now().toString());
  };

  // Não mostrar em ambiente nativo ou se já instalado
  if (Capacitor.isNativePlatform() || isInstalled || !showInstallPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">{t('pwa.install_title')}</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription className="text-sm">
            {t('pwa.install_description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex gap-2">
            <Button 
              onClick={handleInstallClick}
              className="flex-1 h-9"
              size="sm"
            >
              <Download className="mr-2 h-4 w-4" />
              {t('pwa.install_button')}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleDismiss}
              size="sm"
              className="h-9"
            >
              {t('pwa.not_now')}
            </Button>
          </div>
          
          <div className="mt-3 text-xs text-muted-foreground">
            {t('pwa.features_title')}
          </div>
          <div className="text-xs text-muted-foreground mt-1 space-y-1">
            <div>{t('pwa.feature_home_icon')}</div>
            <div>{t('pwa.feature_push_notifications')}</div>
            <div>{t('pwa.feature_fast_loading')}</div>
            <div>{t('pwa.feature_offline')}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};