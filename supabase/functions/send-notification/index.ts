import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationEmailRequest {
  to: string;
  subject: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, message, type = 'info' }: NotificationEmailRequest = await req.json();

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="padding: 20px; border-radius: 8px; ${getTypeStyle(type)}">
          <h2 style="margin: 0 0 16px 0; color: #333;">${subject}</h2>
          <p style="margin: 0; line-height: 1.6; color: #666;">${message}</p>
        </div>
        <div style="margin-top: 20px; padding: 20px; background: #f5f5f5; border-radius: 8px; text-align: center;">
          <p style="margin: 0; color: #999; font-size: 14px;">
            Este é um email automático do TudoFaz. Não responda a este email.
          </p>
        </div>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: "TudoFaz Hub <noreply@tudofaz.com>",
      to: [to],
      subject: `[TudoFaz] ${subject}`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

function getTypeStyle(type: string): string {
  switch (type) {
    case 'success':
      return 'background: #f0f9ff; border-left: 4px solid #10b981;';
    case 'warning':
      return 'background: #fffbeb; border-left: 4px solid #f59e0b;';
    case 'error':
      return 'background: #fef2f2; border-left: 4px solid #ef4444;';
    default:
      return 'background: #f8fafc; border-left: 4px solid #6366f1;';
  }
}

serve(handler);