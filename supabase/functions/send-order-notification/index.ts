import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  user_id: string;
  title: string;
  body: string;
  data?: any;
  type?: 'order' | 'message' | 'affiliate' | 'general';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { user_id, title, body, data, type = 'general' }: NotificationPayload = await req.json();

    console.log(`Enviando notificação para usuário ${user_id}: ${title}`);

    // Buscar todas as subscrições ativas do usuário
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', user_id)
      .eq('active', true);

    if (subError) {
      console.error('Erro ao buscar subscrições:', subError);
      throw subError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('Nenhuma subscrição ativa encontrada para o usuário');
      return new Response(
        JSON.stringify({ message: 'Nenhuma subscrição ativa encontrada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const notifications = [];

    // Enviar notificações para cada subscrição
    for (const subscription of subscriptions) {
      try {
        // Para subscrições web (com endpoint)
        if (subscription.subscription?.endpoint) {
          // Aqui seria usado um serviço como FCM ou similar para web push
          console.log('Enviando para web push:', subscription.subscription.endpoint);
          
          // Criar registro de notificação enviada
          const notificationRecord = {
            user_id,
            title,
            body,
            payload: { data, type },
            status: 'sent',
            sent_at: new Date().toISOString()
          };

          notifications.push(notificationRecord);
        }
        // Para subscrições mobile (Capacitor)
        else if (subscription.subscription?.platform === 'mobile') {
          console.log('Preparando notificação mobile para:', user_id);
          
          // Criar registro de notificação para dispositivos móveis
          const notificationRecord = {
            user_id,
            title,
            body,
            payload: { data, type },
            status: 'pending',
            created_at: new Date().toISOString()
          };

          notifications.push(notificationRecord);
        }
      } catch (error) {
        console.error('Erro ao enviar notificação:', error);
        
        const failedNotification = {
          user_id,
          title,
          body,
          payload: { data, type, error: error.message },
          status: 'failed',
          error_message: error.message,
          created_at: new Date().toISOString()
        };

        notifications.push(failedNotification);
      }
    }

    // Salvar registros das notificações na tabela
    if (notifications.length > 0) {
      const { error: insertError } = await supabase
        .from('push_notifications')
        .insert(notifications);

      if (insertError) {
        console.error('Erro ao salvar notificações:', insertError);
      }
    }

    // Salvar também na tabela de notificações gerais para o usuário
    const { error: generalNotificationError } = await supabase
      .from('notifications')
      .insert({
        user_id,
        title,
        message: body,
        type: type === 'order' ? 'success' : 'info',
        action_url: data?.url || null
      });

    if (generalNotificationError) {
      console.error('Erro ao salvar notificação geral:', generalNotificationError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        notifications_sent: notifications.length,
        subscriptions_found: subscriptions.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Erro na função de notificação:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});