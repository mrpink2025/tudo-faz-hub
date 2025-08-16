import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const { orderId, trackingCode } = await req.json();

    if (!orderId || !trackingCode) {
      return new Response(
        JSON.stringify({ error: "Missing order ID or tracking code" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar o link de afiliado
    const { data: affiliateLink, error: linkError } = await supabaseClient
      .from("affiliate_links")
      .select("id, affiliate_id, listing_id")
      .eq("tracking_code", trackingCode)
      .single();

    if (linkError || !affiliateLink) {
      return new Response(
        JSON.stringify({ error: "Invalid tracking code" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar o pedido
    const { data: order, error: orderError } = await supabaseClient
      .from("orders")
      .select("id, amount, listing_id")
      .eq("id", orderId)
      .eq("listing_id", affiliateLink.listing_id)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar as configurações de comissão do anúncio
    const { data: listing, error: listingError } = await supabaseClient
      .from("listings")
      .select("affiliate_commission_rate")
      .eq("id", affiliateLink.listing_id)
      .single();

    if (listingError || !listing) {
      return new Response(
        JSON.stringify({ error: "Listing not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calcular comissão
    const commissionRate = listing.affiliate_commission_rate || 0;
    const commissionAmount = Math.round((order.amount * commissionRate) / 10000); // Converter de centavos e percentual

    // Atualizar o pedido com informações do afiliado
    const { error: updateOrderError } = await supabaseClient
      .from("orders")
      .update({
        affiliate_id: affiliateLink.affiliate_id,
        affiliate_commission: commissionAmount,
        tracking_code: trackingCode,
      })
      .eq("id", orderId);

    if (updateOrderError) {
      console.error("Error updating order:", updateOrderError);
      return new Response(
        JSON.stringify({ error: "Failed to update order" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Criar registro de comissão
    const { error: commissionError } = await supabaseClient
      .from("affiliate_commissions")
      .insert({
        affiliate_id: affiliateLink.affiliate_id,
        order_id: orderId,
        listing_id: affiliateLink.listing_id,
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        order_amount: order.amount,
        status: "pending",
      });

    if (commissionError) {
      console.error("Error creating commission:", commissionError);
    }

    // Atualizar saldo do afiliado
    const { error: balanceError } = await supabaseClient
      .from("affiliates")
      .update({
        total_earnings: supabaseClient.raw("total_earnings + " + commissionAmount),
        available_balance: supabaseClient.raw("available_balance + " + commissionAmount),
      })
      .eq("id", affiliateLink.affiliate_id);

    if (balanceError) {
      console.error("Error updating affiliate balance:", balanceError);
    }

    // Marcar clique como convertido
    const { error: clickUpdateError } = await supabaseClient
      .from("affiliate_clicks")
      .update({
        converted: true,
        order_id: orderId,
      })
      .eq("affiliate_link_id", affiliateLink.id)
      .eq("converted", false);

    if (clickUpdateError) {
      console.error("Error updating click conversion:", clickUpdateError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        commissionAmount,
        affiliateId: affiliateLink.affiliate_id 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Error in process-affiliate-conversion:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});