import { useEffect, useState } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useNativePushNotifications = () => {
  const [isRegistered, setIsRegistered] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const initializePushNotifications = async () => {
      // Verificar se estamos em um ambiente nativo
      if (!Capacitor.isNativePlatform()) {
        console.log('Push notifications only work on native platforms');
        return;
      }

      try {
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

      } catch (error) {
        console.error('Erro ao inicializar push notifications:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível ativar as notificações',
          variant: 'destructive'
        });
      }
    };

    initializePushNotifications();

    // Listeners para eventos de push notification
    const addListeners = () => {
      // Quando o registro for bem-sucedido
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

      // Quando houver erro no registro
      PushNotifications.addListener('registrationError', (error) => {
        console.error('Error on registration: ' + JSON.stringify(error));
        toast({
          title: 'Erro no registro',
          description: 'Falha ao registrar para notificações',
          variant: 'destructive'
        });
      });

      // Quando uma notificação for recebida
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push notification received: ', notification);
        
        // Mostrar toast para notificação recebida em primeiro plano
        toast({
          title: notification.title || 'Nova notificação',
          description: notification.body || 'Você tem uma nova mensagem',
        });
      });

      // Quando uma notificação for tocada/aberta
      PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('Push notification action performed', notification.actionId, notification.inputValue);
        
        // Aqui você pode navegar para uma tela específica baseado na notificação
        const data = notification.notification.data;
        if (data?.type === 'order') {
          // Navegar para tela de pedidos
          window.location.href = '/pedidos';
        } else if (data?.type === 'message') {
          // Navegar para tela de mensagens  
          window.location.href = '/mensagens';
        }
      });
    };

    addListeners();

    return () => {
      PushNotifications.removeAllListeners();
    };
  }, [toast]);

  return {
    isRegistered,
    token,
    requestPermissions: async () => {
      if (Capacitor.isNativePlatform()) {
        return await PushNotifications.requestPermissions();
      }
      return { receive: 'denied' };
    }
  };
};