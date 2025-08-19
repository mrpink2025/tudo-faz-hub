import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useNativePushNotifications = () => {
  const [isRegistered, setIsRegistered] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // CRÍTICO: Só executar em plataformas nativas, nunca no navegador
    if (!Capacitor.isNativePlatform()) {
      console.log('PushNotifications: Skipping initialization on web platform');
      return;
    }

    const initializePushNotifications = async () => {
      try {
        // Importação dinâmica apenas em plataformas nativas
        const { PushNotifications } = await import('@capacitor/push-notifications');
        
        // Verificar permissões
        const permission = await PushNotifications.checkPermissions();
        
        if (permission.receive === 'prompt') {
          // Solicitar permissões
          const result = await PushNotifications.requestPermissions();
          if (result.receive !== 'granted') {
            toast({
              title: 'Permissão negada',
              description: 'As notificações push foram desabilitadas',
              variant: 'destructive'
            });
            return;
          }
        } else if (permission.receive !== 'granted') {
          toast({
            title: 'Permissão necessária',
            description: 'Ative as notificações nas configurações do app',
            variant: 'destructive'
          });
          return;
        }

        // Registrar para notificações push
        await PushNotifications.register();
        setIsRegistered(true);

        toast({
          title: 'Notificações ativadas!',
          description: 'Você receberá notificações de compras e atualizações',
        });

        // Listeners para eventos de push notification
        PushNotifications.addListener('registration', async (token) => {
          console.log('Push registration success, token: ' + token.value);
          setToken(token.value);
          
          // Salvar token no Supabase para o usuário atual
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase
              .from('push_subscriptions')
              .upsert({
                user_id: user.id,
                subscription: { endpoint: token.value, platform: 'mobile' },
                active: true
              });
          }
        });

        PushNotifications.addListener('registrationError', (error) => {
          console.error('Error on registration: ' + JSON.stringify(error));
          toast({
            title: 'Erro no registro',
            description: 'Falha ao registrar para notificações',
            variant: 'destructive'
          });
        });

        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('Push notification received: ', notification);
          
          toast({
            title: notification.title || 'Nova notificação',
            description: notification.body || 'Você tem uma nova mensagem',
          });
        });

        PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
          console.log('Push notification action performed', notification.actionId, notification.inputValue);
          
          const data = notification.notification.data;
          if (data?.type === 'order') {
            window.location.href = '/pedidos';
          } else if (data?.type === 'message') {
            window.location.href = '/mensagens';
          }
        });

        return () => {
          PushNotifications.removeAllListeners();
        };

      } catch (error) {
        console.error('Erro ao inicializar push notifications:', error);
        // Não mostrar toast de erro para evitar spam no web
      }
    };

    initializePushNotifications();
  }, [toast]);

  return {
    isRegistered,
    token,
    requestPermissions: async () => {
      if (!Capacitor.isNativePlatform()) {
        return { receive: 'denied' };
      }
      
      try {
        const { PushNotifications } = await import('@capacitor/push-notifications');
        return await PushNotifications.requestPermissions();
      } catch {
        return { receive: 'denied' };
      }
    }
  };
};