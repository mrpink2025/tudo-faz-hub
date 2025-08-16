import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LogEntry {
  user_id?: string;
  activity_type: string;
  description: string;
  metadata?: any;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const logData: LogEntry = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Registrar log na tabela activity_logs
    const { data, error } = await supabase
      .from('activity_logs')
      .insert({
        user_id: logData.user_id || null,
        activity_type: logData.activity_type,
        description: logData.description,
        metadata: logData.metadata || {}
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log("Log registrado:", data);

    return new Response(JSON.stringify({ 
      success: true, 
      log_id: data.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Erro ao registrar log:", error);

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