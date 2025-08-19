import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, BellOff, TestTube } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNativePushNotifications } from '@/hooks/useNativePushNotifications';
import { Capacitor } from '@capacitor/core';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export const PWANotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const { toast } = useToast();
  
  // Hook para notificações nativas (mobile)
  const { isRegistered: nativeRegistered, requestPermissions } = useNativePushNotifications();
  
  // Hook para notificações web (fallback)
  const webNotifications = usePushNotifications();

  useEffect(() => {
    // Verificar se é ambiente nativo (mobile) ou web
    if (Capacitor.isNativePlatform()) {
      setIsSupported(true);
      return;
    }

    // Para web, verificar suporte a service workers e notificações
    if ('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
      checkExistingSubscription();
    }

    // Listen for PWA install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const checkExistingSubscription = async () => {
    if (!('serviceWorker' in navigator)) return;
    
    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();
      setSubscription(existingSubscription);
    } catch (error) {
      console.error('Erro ao verificar subscription existente:', error);
    }
  };

  const requestNotificationPermission = async () => {
    // Para plataformas nativas
    if (Capacitor.isNativePlatform()) {
      const result = await requestPermissions();
      if (result.receive === 'granted') {
        toast({
          title: 'Notificações ativadas!',
          description: 'Você receberá notificações sobre seus pedidos e mensagens.',
        });
      } else {
        toast({
          title: 'Permissão negada',
          description: 'Você pode ativar as notificações nas configurações do app.',
          variant: 'destructive'
        });
      }
      return;
    }

    // Para web, usar o hook existente
    try {
      const result = await webNotifications.requestPermission();
      if (result === 'granted') {
        toast({
          title: 'Permissão concedida',
          description: 'Agora você pode receber notificações push.'
        });
      } else {
        toast({
          title: 'Permissão negada',
          description: 'Você não receberá notificações push.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível solicitar permissão para notificações.',
        variant: 'destructive'
      });
    }
  };

  const subscribeUser = async () => {
    if (Capacitor.isNativePlatform()) {
      // Para mobile, já foi tratado no hook nativo
      return;
    }

    try {
      await webNotifications.subscribe();
      toast({
        title: 'Inscrito com sucesso',
        description: 'Você está inscrito para receber notificações push.'
      });
    } catch (error) {
      toast({
        title: 'Erro na inscrição',
        description: 'Erro ao se inscrever para notificações push.',
        variant: 'destructive'
      });
    }
  };

  const unsubscribeUser = async () => {
    if (Capacitor.isNativePlatform()) {
      // Para plataformas nativas, apenas atualizar status no banco
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('push_subscriptions')
          .update({ active: false })
          .eq('user_id', user.id);
      }
      toast({
        title: 'Notificações desativadas',
        description: 'Você não receberá mais notificações push.',
      });
      return;
    }

    try {
      await webNotifications.unsubscribe();
      toast({
        title: 'Desinscrição realizada',
        description: 'Você não receberá mais notificações push.'
      });
    } catch (error) {
      toast({
        title: 'Erro na desinscrição',
        description: 'Erro ao cancelar notificações push.',
        variant: 'destructive'
      });
    }
  };

  const handleTestNotification = () => {
    if (Capacitor.isNativePlatform()) {
      // Para mobile, usar API nativa de notificação local
      toast({
        title: 'Teste de notificação',
        description: 'Esta é uma notificação de teste no mobile!',
      });
    } else {
      webNotifications.testNotification();
      toast({
        title: 'Notificação de teste enviada',
        description: 'Verifique se a notificação apareceu.'
      });
    }
  };

  const handleInstallPWA = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      
      if (outcome === 'accepted') {
        toast({
          title: 'App instalado',
          description: 'TudoFaz Hub foi instalado como PWA!'
        });
      }
      
      setInstallPrompt(null);
    }
  };

  if (!isSupported && !Capacitor.isNativePlatform()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Notificações Push
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Seu {Capacitor.isNativePlatform() ? 'dispositivo' : 'navegador'} não suporta notificações push.
          </p>
        </CardContent>
      </Card>
    );
  }

  const isEnabled = Capacitor.isNativePlatform() ? nativeRegistered : (webNotifications.permission === 'granted' && webNotifications.subscription);
  const currentPermission = Capacitor.isNativePlatform() ? (nativeRegistered ? 'granted' : 'default') : webNotifications.permission;
  const canEnable = Capacitor.isNativePlatform() ? !nativeRegistered : (webNotifications.permission !== 'denied' && !webNotifications.subscription);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isEnabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
            Notificações Push
          </CardTitle>
          <CardDescription>
            {Capacitor.isNativePlatform() 
              ? 'Receba notificações sobre pedidos e mensagens diretamente no seu dispositivo.'
              : 'Receba notificações sobre pedidos e mensagens mesmo quando não estiver no site.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Status das Notificações</h3>
              <p className="text-sm text-muted-foreground">
                {currentPermission === 'default' && 'Permissão não solicitada'}
                {currentPermission === 'granted' && '✓ Notificações ativadas'}
                {currentPermission === 'denied' && 'Permissão negada'}
              </p>
              {isEnabled && (
                <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                  <li>• Novos pedidos recebidos</li>
                  <li>• Status de entrega atualizado</li>
                  <li>• Novas mensagens recebidas</li>
                  <li>• Comissões de afiliado</li>
                </ul>
              )}
            </div>
            <div className="flex gap-2">
              {currentPermission === 'default' && (
                <Button onClick={requestNotificationPermission} disabled={webNotifications.loading}>
                  Permitir Notificações
                </Button>
              )}
              {currentPermission === 'granted' && !isEnabled && canEnable && (
                <Button onClick={subscribeUser} disabled={webNotifications.loading}>
                  Ativar Notificações
                </Button>
              )}
              {isEnabled && (
                <Button variant="outline" onClick={unsubscribeUser} disabled={webNotifications.loading}>
                  Desativar Notificações
                </Button>
              )}
            </div>
          </div>

          {isEnabled && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleTestNotification}>
                <TestTube className="mr-2 h-4 w-4" />
                Testar Notificação
              </Button>
            </div>
          )}

          {currentPermission === 'denied' && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-sm text-amber-800">
                Para receber notificações, ative nas configurações do {Capacitor.isNativePlatform() ? 'app' : 'navegador'}.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {installPrompt && !Capacitor.isNativePlatform() && (
        <Card>
          <CardHeader>
            <CardTitle>Instalar App</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Instale o TudoFaz Hub como um aplicativo para uma experiência melhor e notificações nativas.
            </p>
            <Button onClick={handleInstallPWA}>
              Instalar App
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};