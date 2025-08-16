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

    const { trackingCode, listingId, userAgent, referrer } = await req.json();

    if (!trackingCode || !listingId) {
      return new Response(
        JSON.stringify({ error: "Missing tracking code or listing ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar o link de afiliado
    const { data: affiliateLink, error: linkError } = await supabaseClient
      .from("affiliate_links")
      .select("id, affiliate_id, listing_id")
      .eq("tracking_code", trackingCode)
      .eq("listing_id", listingId)
      .single();

    if (linkError || !affiliateLink) {
      return new Response(
        JSON.stringify({ error: "Invalid tracking code" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Obter IP do usuário
    const clientIP = req.headers.get("x-forwarded-for") || 
                     req.headers.get("x-real-ip") || 
                     "unknown";

    // Verificar se já existe um clique nas últimas 24 horas do mesmo IP
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: existingClick } = await supabaseClient
      .from("affiliate_clicks")
      .select("id")
      .eq("affiliate_link_id", affiliateLink.id)
      .eq("visitor_ip", clientIP)
      .gte("clicked_at", oneDayAgo)
      .single();

    // Se não existir clique recente, registrar novo clique
    if (!existingClick) {
      // Registrar o clique
      const { error: clickError } = await supabaseClient
        .from("affiliate_clicks")
        .insert({
          affiliate_link_id: affiliateLink.id,
          visitor_ip: clientIP,
          user_agent: userAgent || req.headers.get("user-agent"),
          referrer: referrer || req.headers.get("referer"),
          clicked_at: new Date().toISOString(),
        });

      if (clickError) {
        console.error("Error inserting click:", clickError);
      }

      // Atualizar contador de cliques no link
      const { error: updateError } = await supabaseClient
        .from("affiliate_links")
        .update({ 
          clicks_count: supabaseClient.raw("clicks_count + 1"),
          last_clicked_at: new Date().toISOString()
        })
        .eq("id", affiliateLink.id);

      if (updateError) {
        console.error("Error updating click count:", updateError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, tracked: !existingClick }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Error in track-affiliate-click:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});