import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export const useAppUpdater = () => {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentVersion, setCurrentVersion] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker não suportado');
      return;
    }

    let refreshing = false;

    // Listener para atualizações do service worker
    const handleSWMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SW_UPDATED') {
        console.log('App atualizado automaticamente!', event.data);
        
        if (!refreshing) {
          refreshing = true;
          
          toast({
            title: '🚀 App Atualizado!',
            description: `Nova versão ${event.data.version} instalada automaticamente`,
            duration: 3000,
          });

          // Recarregar após um breve delay para mostrar o toast
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        }
      }
    };

    navigator.serviceWorker.addEventListener('message', handleSWMessage);

    // Verificar atualizações periodicamente
    const checkForUpdates = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        
        if (registration.active) {
          // Verificar se há service worker aguardando
          if (registration.waiting) {
            setIsUpdateAvailable(true);
            console.log('Atualização disponível, aguardando ativação');
            
            // Ativar automaticamente o novo service worker
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            return;
          }

          // Forçar verificação de atualização
          registration.update().catch(console.error);
          
          // Usar MessageChannel para comunicação bidirecional
          const messageChannel = new MessageChannel();
          messageChannel.port1.onmessage = (event) => {
            if (event.data.type === 'UPDATE_CHECK_RESULT') {
              if (event.data.hasUpdate) {
                setIsUpdateAvailable(true);
                setCurrentVersion(event.data.newVersion);
                console.log('Nova versão disponível:', event.data.newVersion);
              }
            }
          };

          registration.active.postMessage(
            { type: 'CHECK_UPDATE' },
            [messageChannel.port2]
          );
        }
      } catch (error) {
        console.error('Erro ao verificar atualizações:', error);
      }
    };

    // Verificar atualizações imediatamente
    checkForUpdates();

    // Verificar atualizações a cada 60 segundos
    const updateInterval = setInterval(checkForUpdates, 60000);

    // Listener para controlar novas instalações
    const handleControllerChange = () => {
      if (!refreshing) {
        refreshing = true;
        console.log('Novo service worker assumiu controle, recarregando...');
        window.location.reload();
      }
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    // Cleanup
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      clearInterval(updateInterval);
    };
  }, [toast]);

  const forceUpdate = async () => {
    if (!('serviceWorker' in navigator)) return;

    try {
      setIsUpdating(true);
      
      const registration = await navigator.serviceWorker.ready;
      
      if (registration.waiting) {
        // Forçar ativação do service worker em espera
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      } else {
        // Forçar verificação de nova versão
        await registration.update();
      }

      toast({
        title: 'Atualizando app...',
        description: 'Por favor aguarde enquanto aplicamos as atualizações',
      });

    } catch (error) {
      console.error('Erro ao forçar atualização:', error);
      toast({
        title: 'Erro na atualização',
        description: 'Não foi possível atualizar o app',
        variant: 'destructive'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    isUpdateAvailable,
    isUpdating,
    currentVersion,
    forceUpdate
  };
};