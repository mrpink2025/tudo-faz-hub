import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Criar cliente Supabase com chave de serviço para gerar tokens
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetEmailRequest {
  email: string;
  redirectUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, redirectUrl }: PasswordResetEmailRequest = await req.json();

    console.log("Processing password reset for:", email);
    console.log("Redirect URL:", redirectUrl);

    // Gerar link de redefinição de senha usando o Supabase Admin API
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: redirectUrl
      }
    });

    if (error) {
      console.error("Error generating reset link:", error);
      throw new Error(`Failed to generate reset link: ${error.message}`);
    }

    const resetLinkWithToken = data.properties?.action_link;
    
    if (!resetLinkWithToken) {
      throw new Error("No action link generated");
    }

    console.log("Generated reset link with tokens");

    // Enviar email bonito personalizado com o link real que contém tokens
    const emailResponse = await resend.emails.send({
      from: "TudoFaz Hub <noreply@tudofaz.com>",
      to: [email],
      subject: "🔑 Redefinir sua senha - TudoFaz Hub",
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Redefinir Senha - TudoFaz Hub</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8f9fa;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td align="center" style="padding: 40px 20px;">
                        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                            <!-- Header -->
                            <tr>
                                <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">🔑 TudoFaz Hub</h1>
                                    <p style="margin: 8px 0 0 0; color: #ffffff; opacity: 0.9; font-size: 16px;">Redefinição de Senha</p>
                                </td>
                            </tr>
                            
                            <!-- Content -->
                            <tr>
                                <td style="padding: 40px 30px;">
                                    <h2 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 24px; font-weight: 600;">Esqueceu sua senha?</h2>
                                    
                                    <p style="margin: 0 0 20px 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                                        Não se preocupe! Recebemos uma solicitação para redefinir a senha da sua conta no TudoFaz Hub.
                                    </p>
                                    
                                    <p style="margin: 0 0 30px 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                                        Clique no botão abaixo para criar uma nova senha:
                                    </p>
                                    
                                    <!-- CTA Button -->
                                    <table role="presentation" style="margin: 0 auto;">
                                        <tr>
                                            <td style="border-radius: 8px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); text-align: center;">
                                                <a href="${resetLinkWithToken}" style="display: inline-block; padding: 16px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px;">
                                                    🔒 Redefinir Minha Senha
                                                </a>
                                            </td>
                                        </tr>
                                    </table>
                                    
                                    <p style="margin: 30px 0 20px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                                        Se o botão não funcionar, copie e cole este link no seu navegador:
                                    </p>
                                    
                                    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; border-left: 4px solid #667eea; word-break: break-all;">
                                        <code style="color: #374151; font-size: 14px;">${resetLinkWithToken}</code>
                                    </div>
                                    
                                    <div style="margin: 30px 0; padding: 20px; background-color: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
                                        <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                                            ⚠️ <strong>Importante:</strong> Este link expira em 1 hora por motivos de segurança. Se não foi você quem solicitou esta redefinição, pode ignorar este email com segurança.
                                        </p>
                                    </div>
                                    
                                    <div style="margin: 30px 0; padding: 20px; background-color: #dbeafe; border-radius: 8px; border-left: 4px solid #3b82f6;">
                                        <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.5;">
                                            🛡️ <strong>Segurança:</strong> Este link é único e só pode ser usado uma vez. Após redefinir sua senha, o link será automaticamente invalidado.
                                        </p>
                                    </div>
                                </td>
                            </tr>
                            
                            <!-- Footer -->
                            <tr>
                                <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                                    <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                                        Este email foi enviado pelo TudoFaz Hub
                                    </p>
                                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                        Se você tem dúvidas, entre em contato conosco.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
      `,
    });

    console.log("Beautiful password reset email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      emailResponse,
      resetLink: resetLinkWithToken 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-password-reset function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);