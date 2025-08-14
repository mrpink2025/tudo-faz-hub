import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, BellOff, TestTube } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useToast } from '@/hooks/use-toast';

export const PWANotifications = () => {
  const {
    isSupported,
    permission,
    subscription,
    loading,
    requestPermission,
    subscribe,
    unsubscribe,
    testNotification
  } = usePushNotifications();
  
  const { toast } = useToast();
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
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

  const handlePermissionRequest = async () => {
    try {
      const result = await requestPermission();
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
      toast({
        title: 'Erro',
        description: 'Erro ao solicitar permissão para notificações.',
        variant: 'destructive'
      });
    }
  };

  const handleSubscribe = async () => {
    try {
      await subscribe();
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

  const handleUnsubscribe = async () => {
    try {
      await unsubscribe();
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
    testNotification();
    toast({
      title: 'Notificação de teste enviada',
      description: 'Verifique se a notificação apareceu.'
    });
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

  if (!isSupported) {
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
            Seu navegador não suporta notificações push.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações Push
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Status das Notificações</h3>
              <p className="text-sm text-muted-foreground">
                {permission === 'default' && 'Permissão não solicitada'}
                {permission === 'granted' && 'Permissão concedida'}
                {permission === 'denied' && 'Permissão negada'}
              </p>
            </div>
            <div className="flex gap-2">
              {permission === 'default' && (
                <Button onClick={handlePermissionRequest} disabled={loading}>
                  Permitir Notificações
                </Button>
              )}
              {permission === 'granted' && !subscription && (
                <Button onClick={handleSubscribe} disabled={loading}>
                  Ativar Notificações
                </Button>
              )}
              {permission === 'granted' && subscription && (
                <Button variant="outline" onClick={handleUnsubscribe} disabled={loading}>
                  Desativar Notificações
                </Button>
              )}
            </div>
          </div>

          {permission === 'granted' && subscription && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleTestNotification}>
                <TestTube className="mr-2 h-4 w-4" />
                Testar Notificação
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {installPrompt && (
        <Card>
          <CardHeader>
            <CardTitle>Instalar App</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Instale o TudoFaz Hub como um aplicativo para uma experiência melhor.
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