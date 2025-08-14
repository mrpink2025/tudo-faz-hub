import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  image?: string;
  data?: Record<string, any>;
  tag?: string;
  requireInteraction?: boolean;
}

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [loading, setLoading] = useState(false);

  // VAPID public key - you'll need to generate this
  const VAPID_PUBLIC_KEY = 'BKxUEcOTVL1TnIILVSvQEq3Q8Z8KHXv1IJGo7HJQZQw-V2F9Z7HgqJ8I2-Y7w8Z7C9D1F3G4H6J8L2M4N6P8R9S1T3';

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
      
      // Check if already subscribed
      navigator.serviceWorker.ready.then(async (registration) => {
        const existingSubscription = await registration.pushManager.getSubscription();
        if (existingSubscription) {
          setSubscription(existingSubscription as any);
        }
      });
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      throw new Error('Push notifications are not supported');
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, [isSupported]);

  const subscribe = useCallback(async () => {
    if (!isSupported || permission !== 'granted') {
      throw new Error('Permission not granted for push notifications');
    }

    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      const subscriptionData = {
        endpoint: pushSubscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(pushSubscription.getKey('p256dh')!),
          auth: arrayBufferToBase64(pushSubscription.getKey('auth')!)
        }
      };

      // Save subscription to database
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await supabase
          .from('push_subscriptions')
          .upsert({
            user_id: user.id,
            subscription: subscriptionData,
            active: true
          });
      }

      setSubscription(subscriptionData);
      return subscriptionData;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [isSupported, permission]);

  const unsubscribe = useCallback(async () => {
    if (!subscription) return;

    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const pushSubscription = await registration.pushManager.getSubscription();
      
      if (pushSubscription) {
        await pushSubscription.unsubscribe();
      }

      // Remove from database
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await supabase
          .from('push_subscriptions')
          .update({ active: false })
          .eq('user_id', user.id);
      }

      setSubscription(null);
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [subscription]);

  const sendNotification = useCallback(async (notification: NotificationPayload, targetUserId?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // If targeting specific user, get their subscription
      let targetSubscription = subscription;
      
      if (targetUserId && targetUserId !== user.id) {
        const { data: userSub } = await supabase
          .from('push_subscriptions')
          .select('subscription')
          .eq('user_id', targetUserId)
          .eq('active', true)
          .single();
        
        targetSubscription = userSub?.subscription;
      }

      if (!targetSubscription) {
        throw new Error('No active subscription found');
      }

      // Send notification via edge function
      const response = await supabase.functions.invoke('send-push-notification', {
        body: {
          subscription: targetSubscription,
          notification,
          userId: targetUserId || user.id
        }
      });

      if (response.error) {
        throw response.error;
      }

      return response.data;
    } catch (error) {
      console.error('Error sending push notification:', error);
      throw error;
    }
  }, [subscription]);

  const testNotification = useCallback(() => {
    if (permission === 'granted') {
      const registration = navigator.serviceWorker.getRegistration();
      registration.then((reg) => {
        if (reg) {
          reg.showNotification('TudoFaz Hub', {
            body: 'Notificações estão funcionando!',
            icon: '/icon-192x192.png',
            badge: '/icon-72x72.png',
            tag: 'test',
            data: { url: '/' }
          });
        }
      });
    }
  }, [permission]);

  return {
    isSupported,
    permission,
    subscription: !!subscription,
    loading,
    requestPermission,
    subscribe,
    unsubscribe,
    sendNotification,
    testNotification
  };
};

// Helper functions
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}