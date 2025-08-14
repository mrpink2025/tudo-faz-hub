import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
  badge?: string;
  image?: string;
  data?: Record<string, any>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  tag?: string;
  requireInteraction?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { 
      subscription, 
      notification, 
      userId 
    }: { 
      subscription: PushSubscription; 
      notification: NotificationPayload;
      userId?: string;
    } = await req.json();

    // VAPID keys - you'll need to generate these
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    const vapidEmail = Deno.env.get('VAPID_EMAIL') || 'admin@tudofaz.com';

    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error('VAPID keys not configured');
    }

    // Import web push library
    const webpush = await import('npm:web-push@3.6.6');
    
    webpush.setVapidDetails(
      `mailto:${vapidEmail}`,
      vapidPublicKey,
      vapidPrivateKey
    );

    // Prepare notification payload
    const payload = {
      title: notification.title,
      body: notification.body,
      icon: notification.icon || '/icon-192x192.png',
      badge: notification.badge || '/icon-72x72.png',
      image: notification.image,
      data: {
        url: notification.data?.url || '/',
        timestamp: Date.now(),
        ...notification.data
      },
      actions: notification.actions || [
        {
          action: 'open',
          title: 'Abrir'
        },
        {
          action: 'close',
          title: 'Fechar'
        }
      ],
      tag: notification.tag || 'default',
      requireInteraction: notification.requireInteraction || false,
      renotify: true,
      vibrate: [200, 100, 200]
    };

    // Send push notification
    const result = await webpush.sendNotification(
      subscription,
      JSON.stringify(payload),
      {
        TTL: 24 * 60 * 60, // 24 hours
        urgency: 'normal'
      }
    );

    // Log notification in database
    await supabaseClient
      .from('push_notifications')
      .insert({
        user_id: userId,
        title: notification.title,
        body: notification.body,
        payload: payload,
        status: 'sent',
        sent_at: new Date().toISOString()
      });

    console.log('Push notification sent successfully:', result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        result: {
          statusCode: result.statusCode,
          headers: result.headers
        }
      }),
      {
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      }
    );

  } catch (error) {
    console.error('Push notification error:', error);
    
    // Log failed notification
    try {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      await supabaseClient
        .from('push_notifications')
        .insert({
          title: 'Failed notification',
          body: error.message,
          status: 'failed',
          error_message: error.message,
          sent_at: new Date().toISOString()
        });
    } catch (logError) {
      console.error('Failed to log notification error:', logError);
    }
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send push notification',
        message: error.message 
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      }
    );
  }
});