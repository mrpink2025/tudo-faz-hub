import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderStatusNotificationRequest {
  orderId: string;
  oldStatus: string;
  newStatus: string;
  buyerUserId: string;
  affiliateId?: string;
  listingTitle: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { 
      orderId, 
      oldStatus, 
      newStatus, 
      buyerUserId, 
      affiliateId, 
      listingTitle 
    }: OrderStatusNotificationRequest = await req.json();

    if (!orderId || !newStatus || !buyerUserId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const notifications = [];

    // Mapear status para mensagens amigáveis
    const statusLabels: Record<string, string> = {
      "pending": "Pendente",
      "in_analysis": "Em Análise",
      "approved": "Aprovado",
      "canceled": "Cancelado",
    };

    const newStatusLabel = statusLabels[newStatus] || newStatus;

    // Notificação para o comprador
    const buyerNotification = {
      user_id: buyerUserId,
      title: `Status do Pedido Atualizado`,
      message: `O status do seu pedido "${listingTitle}" foi alterado para: ${newStatusLabel}`,
      type: newStatus === "approved" ? "success" : 
            newStatus === "canceled" ? "error" : "info",
      action_url: `/pedidos/${orderId}`, // Assumindo que haverá uma página de detalhes do pedido
    };

    notifications.push(buyerNotification);

    // Notificação para o afiliado, se houver
    if (affiliateId) {
      // Buscar user_id do afiliado
      const { data: affiliate } = await supabaseClient
        .from("affiliates")
        .select("user_id")
        .eq("id", affiliateId)
        .single();

      if (affiliate) {
        const affiliateNotification = {
          user_id: affiliate.user_id,
          title: `Status da Venda Atualizado`,
          message: `O status da venda que você indicou "${listingTitle}" foi alterado para: ${newStatusLabel}`,
          type: newStatus === "approved" ? "success" : 
                newStatus === "canceled" ? "error" : "info",
          action_url: `/afiliados`,
        };

        notifications.push(affiliateNotification);
      }
    }

    // Inserir todas as notificações
    const { error: notificationError } = await supabaseClient
      .from("notifications")
      .insert(notifications);

    if (notificationError) {
      console.error("Error inserting notifications:", notificationError);
      throw notificationError;
    }

    // Se o pedido foi aprovado, confirmar comissão do afiliado
    if (newStatus === "approved" && affiliateId) {
      const { error: commissionError } = await supabaseClient
        .from("affiliate_commissions")
        .update({ status: "confirmed" })
        .eq("order_id", orderId)
        .eq("status", "pending");

      if (commissionError) {
        console.error("Error confirming commission:", commissionError);
      }
    }

    // Se o pedido foi cancelado, cancelar comissão do afiliado
    if (newStatus === "canceled" && affiliateId) {
      const { data: commission } = await supabaseClient
        .from("affiliate_commissions")
        .select("commission_amount, affiliate_id")
        .eq("order_id", orderId)
        .single();

      if (commission) {
        // Cancelar comissão
        const { error: commissionError } = await supabaseClient
          .from("affiliate_commissions")
          .update({ status: "canceled" })
          .eq("order_id", orderId);

        if (commissionError) {
          console.error("Error canceling commission:", commissionError);
        } else {
          // Remover do saldo disponível do afiliado
          const { error: balanceError } = await supabaseClient
            .from("affiliates")
            .update({
              available_balance: supabaseClient.raw(`available_balance - ${commission.commission_amount}`),
              total_earnings: supabaseClient.raw(`total_earnings - ${commission.commission_amount}`)
            })
            .eq("id", commission.affiliate_id);

          if (balanceError) {
            console.error("Error updating affiliate balance:", balanceError);
          }
        }
      }
    }

    console.log(`Order ${orderId} status changed from ${oldStatus} to ${newStatus}`);
    console.log(`Notifications sent to ${notifications.length} users`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        notificationsSent: notifications.length,
        orderId,
        newStatus 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error: any) {
    console.error("Error in send-order-status-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});