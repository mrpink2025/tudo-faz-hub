import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: 'affiliate_sale_confirmed' | 'affiliate_request_new' | 'order_status_change';
  data: {
    user_email: string;
    user_name: string;
    listing_title?: string;
    commission_amount?: number;
    affiliate_code?: string;
    order_id?: string;
    new_status?: string;
    previous_status?: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, data }: NotificationRequest = await req.json();

    // Inicializar Supabase para logs
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let emailSubject = '';
    let emailHtml = '';

    switch (type) {
      case 'affiliate_sale_confirmed':
        emailSubject = '🎉 Nova venda confirmada - Comissão ganha!';
        emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #16a34a;">Parabéns! Você ganhou uma comissão!</h1>
            <p>Olá, <strong>${data.user_name}</strong>!</p>
            <p>Temos ótimas notícias! Uma venda foi confirmada através do seu link de afiliado.</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Detalhes da venda:</h3>
              <p><strong>Produto:</strong> ${data.listing_title}</p>
              <p><strong>Sua comissão:</strong> ${new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format((data.commission_amount || 0) / 100)}</p>
              <p><strong>Código de afiliado:</strong> ${data.affiliate_code}</p>
            </div>
            
            <p>A comissão será creditada em seu saldo e estará disponível para saque em breve.</p>
            <p>Continue promovendo nossos produtos e ganhe ainda mais!</p>
            
            <hr style="margin: 30px 0;">
            <p style="color: #6b7280; font-size: 14px;">
              Acesse seu painel de afiliado para mais detalhes.
            </p>
          </div>
        `;
        break;

      case 'affiliate_request_new':
        emailSubject = '📝 Nova solicitação de afiliação recebida';
        emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Nova solicitação de afiliação</h1>
            <p>Olá, <strong>${data.user_name}</strong>!</p>
            <p>Você recebeu uma nova solicitação de afiliação para seu produto.</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Detalhes:</h3>
              <p><strong>Produto:</strong> ${data.listing_title}</p>
              <p><strong>Código do afiliado:</strong> ${data.affiliate_code}</p>
            </div>
            
            <p>Acesse sua Central do Anunciante para aprovar ou rejeitar esta solicitação.</p>
            
            <hr style="margin: 30px 0;">
            <p style="color: #6b7280; font-size: 14px;">
              Gerencie suas solicitações no painel do anunciante.
            </p>
          </div>
        `;
        break;

      case 'order_status_change':
        emailSubject = `📦 Status do pedido alterado: ${data.new_status}`;
        emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #7c3aed;">Status do pedido atualizado</h1>
            <p>Olá, <strong>${data.user_name}</strong>!</p>
            <p>O status do seu pedido foi atualizado.</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Detalhes do pedido:</h3>
              <p><strong>Produto:</strong> ${data.listing_title}</p>
              <p><strong>Pedido ID:</strong> #${data.order_id?.slice(0, 8)}</p>
              <p><strong>Status anterior:</strong> ${data.previous_status}</p>
              <p><strong>Novo status:</strong> <span style="color: #16a34a; font-weight: bold;">${data.new_status}</span></p>
            </div>
            
            <p>Acompanhe o andamento do seu pedido através do nosso sistema.</p>
            
            <hr style="margin: 30px 0;">
            <p style="color: #6b7280; font-size: 14px;">
              Entre em contato conosco caso tenha dúvidas.
            </p>
          </div>
        `;
        break;

      default:
        throw new Error('Tipo de notificação inválido');
    }

    // Enviar email
    const emailResponse = await resend.emails.send({
      from: "TudoFaz <notificacoes@resend.dev>",
      to: [data.user_email],
      subject: emailSubject,
      html: emailHtml,
    });

    // Registrar log da atividade
    await supabase.from('activity_logs').insert({
      activity_type: `email_notification_${type}`,
      description: `Email de notificação enviado: ${emailSubject}`,
      metadata: {
        email_id: emailResponse.data?.id,
        recipient: data.user_email,
        type,
        success: true
      }
    });

    console.log("Email de notificação enviado:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      email_id: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Erro ao enviar notificação:", error);
    
    // Tentar registrar log de erro
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      await supabase.from('activity_logs').insert({
        activity_type: 'email_notification_error',
        description: `Erro ao enviar notificação: ${error.message}`,
        metadata: {
          error: error.message,
          success: false
        }
      });
    } catch (logError) {
      console.error("Erro ao registrar log:", logError);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);