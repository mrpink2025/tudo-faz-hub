import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TrackingUpdate {
  orderId: string;
  trackingCode?: string;
  status: string;
  location?: string;
  estimatedDelivery?: string;
  courierName?: string;
  notes?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const updateData: TrackingUpdate = await req.json();

    // Atualizar informações do pedido
    const { data: order, error: orderError } = await supabaseClient
      .from("orders")
      .update({
        tracking_code: updateData.trackingCode,
        status: updateData.status,
        estimated_delivery_date: updateData.estimatedDelivery,
        seller_notes: updateData.notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", updateData.orderId)
      .select("*, profiles:user_id(*)")
      .single();

    if (orderError) throw orderError;

    // Criar notificação de atualização
    const statusMessages = {
      shipped: "Seu pedido foi enviado",
      in_transit: "Seu pedido está em trânsito",
      out_for_delivery: "Seu pedido está saindo para entrega",
      delivered: "Seu pedido foi entregue",
      failed_delivery: "Falha na entrega do seu pedido",
    };

    const message = statusMessages[updateData.status as keyof typeof statusMessages] || 
                   "Status do seu pedido foi atualizado";

    // Inserir notificação no banco
    await supabaseClient.from("order_notifications").insert({
      order_id: updateData.orderId,
      user_id: order.user_id,
      seller_id: order.seller_id,
      type: `order_${updateData.status}`,
      title: "Atualização de Entrega",
      message: `${message}${updateData.trackingCode ? ` - Código: ${updateData.trackingCode}` : ""}`,
    });

    // Enviar push notification
    if (order.profiles?.id) {
      try {
        await supabaseClient.functions.invoke("send-push-notification", {
          body: {
            title: "📦 Atualização de Entrega",
            body: message,
            url: `/pedidos`,
            userId: order.user_id,
          },
        });
      } catch (pushError) {
        console.error("Failed to send push notification:", pushError);
        // Continua mesmo se a push notification falhar
      }
    }

    // Log da atualização
    console.log("Tracking updated:", {
      orderId: updateData.orderId,
      status: updateData.status,
      trackingCode: updateData.trackingCode,
      timestamp: new Date().toISOString(),
    });

    const result = {
      success: true,
      message: "Tracking information updated successfully",
      order: {
        id: order.id,
        status: order.status,
        trackingCode: order.tracking_code,
        estimatedDelivery: order.estimated_delivery_date,
      },
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error updating tracking:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});