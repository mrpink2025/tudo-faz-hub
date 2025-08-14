import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
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

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");

    const { session_id } = await req.json();
    if (!session_id) throw new Error("Session ID is required");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    if (session.payment_status !== "paid") {
      throw new Error("Payment not completed");
    }

    const credits = parseInt(session.metadata?.credits || "0");
    const packId = session.metadata?.pack_id;

    if (!credits) {
      throw new Error("Invalid credits amount");
    }

    // Create credit transaction
    const { error: transactionError } = await supabaseClient
      .from("credit_transactions")
      .insert({
        user_id: user.id,
        type: "purchase",
        credits: credits,
        amount: session.amount_total,
        currency: session.currency?.toUpperCase(),
        stripe_session_id: session_id,
        metadata: { pack_id: packId }
      });

    if (transactionError) {
      console.error("Transaction insert error:", transactionError);
      throw new Error("Failed to record transaction");
    }

    // Update user wallet
    const { data: wallet } = await supabaseClient
      .from("user_wallets")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle();

    if (wallet) {
      const { error: updateError } = await supabaseClient
        .from("user_wallets")
        .update({
          balance: wallet.balance + credits,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", user.id);

      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabaseClient
        .from("user_wallets")
        .insert({
          user_id: user.id,
          balance: credits,
          currency: "BRL"
        });

      if (insertError) throw insertError;
    }

    return new Response(JSON.stringify({ 
      success: true, 
      credits_added: credits,
      message: "Pagamento verificado e créditos adicionados com sucesso!" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("verify-payment-credits error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});