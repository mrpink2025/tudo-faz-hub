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
        // Verificar se o Capacitor está pronto e o plugin está disponível
        const isPluginAvailable = Capacitor.isPluginAvailable('PushNotifications');
        if (!isPluginAvailable) {
          console.log('PushNotifications: Plugin not available on this platform');
          return;
        }

        // Aguardar um pequeno delay para garantir que o Capacitor está pronto
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Importação dinâmica apenas em plataformas nativas
        const { PushNotifications } = await import('@capacitor/push-notifications');
        
        // Verificar permissões com try-catch adicional
        let permission;
        try {
          permission = await PushNotifications.checkPermissions();
        } catch (permError) {
          console.error('Erro ao verificar permissões:', permError);
          return;
        }
        
        if (permission.receive === 'prompt') {
          // Solicitar permissões com delay para evitar crash
          await new Promise(resolve => setTimeout(resolve, 500));
          
          try {
            const result = await PushNotifications.requestPermissions();
            if (result.receive !== 'granted') {
              console.log('Permissão de notificações negada pelo usuário');
              return;
            }
          } catch (requestError) {
            console.error('Erro ao solicitar permissões:', requestError);
            return;
          }
        } else if (permission.receive !== 'granted') {
          console.log('Permissões de notificação não concedidas');
          return;
        }

        // Registrar para notificações push com try-catch
        try {
          await PushNotifications.register();
          setIsRegistered(true);
          console.log('Push notifications registradas com sucesso');
        } catch (registerError) {
          console.error('Erro ao registrar push notifications:', registerError);
          return;
        }

        // Listeners para eventos de push notification com tratamento de erros
        try {
          PushNotifications.addListener('registration', async (token) => {
            console.log('Push registration success, token: ' + token.value);
            setToken(token.value);
            
            try {
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
            } catch (dbError) {
              console.error('Erro ao salvar token no banco:', dbError);
            }
          });

          PushNotifications.addListener('registrationError', (error) => {
            console.error('Error on registration: ' + JSON.stringify(error));
          });

          PushNotifications.addListener('pushNotificationReceived', (notification) => {
            console.log('Push notification received: ', notification);
            
            try {
              toast({
                title: notification.title || 'Nova notificação',
                description: notification.body || 'Você tem uma nova mensagem',
              });
            } catch (toastError) {
              console.error('Erro ao exibir toast:', toastError);
            }
          });

          PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
            console.log('Push notification action performed', notification.actionId, notification.inputValue);
            
            try {
              const data = notification.notification.data;
              if (data?.type === 'order') {
                window.location.href = '/pedidos';
              } else if (data?.type === 'message') {
                window.location.href = '/mensagens';
              }
            } catch (navError) {
              console.error('Erro ao navegar:', navError);
            }
          });
        } catch (listenerError) {
          console.error('Erro ao configurar listeners:', listenerError);
        }

        return () => {
          try {
            PushNotifications.removeAllListeners();
          } catch (cleanupError) {
            console.error('Erro ao remover listeners:', cleanupError);
          }
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
      if (!Capacitor.isNativePlatform() || !Capacitor.isPluginAvailable('PushNotifications')) {
        return { receive: 'denied' };
      }
      
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        const { PushNotifications } = await import('@capacitor/push-notifications');
        return await PushNotifications.requestPermissions();
      } catch (error) {
        console.error('Erro ao solicitar permissões:', error);
        return { receive: 'denied' };
      }
    }
  };
};