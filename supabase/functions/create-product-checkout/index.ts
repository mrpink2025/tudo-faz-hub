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
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");

    const { 
      items, 
      seller_id, 
      customer_data, 
      shipping_address, 
      total_amount 
    } = await req.json();

    // Validate quantity limits for each item
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    for (const item of items) {
      const { data: listing, error } = await supabaseService
        .from('listings')
        .select('max_quantity_per_purchase, inventory_count, title')
        .eq('id', item.listing_id)
        .single();

      if (error) throw new Error(`Erro ao validar produto: ${item.title || item.listing_id}`);
      
      // Check max quantity per purchase
      if (listing.max_quantity_per_purchase && item.quantity > listing.max_quantity_per_purchase) {
        throw new Error(`Máximo de ${listing.max_quantity_per_purchase} unidades por compra para ${listing.title}`);
      }
      
      // Check inventory
      if (listing.inventory_count && item.quantity > listing.inventory_count) {
        throw new Error(`Apenas ${listing.inventory_count} unidades disponíveis para ${listing.title}`);
      }
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Create line items for Stripe
    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: "brl",
        product_data: {
          name: item.title || `Produto ID: ${item.listing_id}`,
          description: `Quantidade: ${item.quantity}`,
        },
        unit_amount: item.price,
      },
      quantity: item.quantity,
    }));

    // Create Stripe checkout session with pre-filled customer data
    const sessionConfig: any = {
      line_items: lineItems,
      mode: "payment",
      success_url: `${req.headers.get("origin")}/pagamento-sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/pagamento-cancelado`,
      metadata: {
        user_id: user.id,
        seller_id: seller_id,
        items: JSON.stringify(items),
      },
      payment_method_types: ["card", "boleto"],
      billing_address_collection: "required",
    };

    // Pre-fill customer data if provided
    if (customer_data) {
      sessionConfig.customer_email = customer_data.email;
      if (customer_data.name) {
        sessionConfig.customer_creation = "always";
      }
    } else {
      sessionConfig.customer_email = user.email;
    }

    // Always require shipping address and add shipping options
    sessionConfig.shipping_address_collection = {
      allowed_countries: ['BR'],
    };
    
    sessionConfig.shipping_options = [
      {
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: {
            amount: 1500, // R$ 15,00 PAC
            currency: 'brl',
          },
          display_name: 'PAC - Correios (5-8 dias úteis)',
          delivery_estimate: {
            minimum: {
              unit: 'business_day',
              value: 5,
            },
            maximum: {
              unit: 'business_day', 
              value: 8,
            },
          },
        },
      },
      {
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: {
            amount: 2500, // R$ 25,00 Sedex
            currency: 'brl',
          },
          display_name: 'Sedex - Correios (1-3 dias úteis)',
          delivery_estimate: {
            minimum: {
              unit: 'business_day',
              value: 1,
            },
            maximum: {
              unit: 'business_day',
              value: 3,
            },
          },
        },
      },
    ];

    const session = await stripe.checkout.sessions.create(sessionConfig);

    // Create order record using the same service client

    const totalAmount = total_amount || items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    
    const orderData: any = {
      user_id: user.id,
      seller_id: seller_id,
      stripe_session_id: session.id,
      amount: totalAmount,
      currency: "brl",
      status: "pending",
      order_items: items,
    };

    // Add shipping address if provided
    if (shipping_address) {
      orderData.delivery_address = shipping_address;
    }

    await supabaseService.from("orders").insert(orderData);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});