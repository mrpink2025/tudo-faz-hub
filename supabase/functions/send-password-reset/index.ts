import React from 'npm:react@18.3.1'
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'
import { Resend } from 'npm:resend@4.0.0'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { PasswordResetEmail } from './_templates/password-reset.tsx'

console.log("🚀 Password reset webhook function starting...");

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)
const hookSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET') as string

console.log("🔍 Environment check:", {
  hasResendKey: !!Deno.env.get('RESEND_API_KEY'),
  hasHookSecret: !!hookSecret
});

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const payload = await req.text()
    const headers = Object.fromEntries(req.headers)
    
    console.log("📨 Received webhook payload");
    
    if (!hookSecret) {
      console.error("❌ Missing SEND_EMAIL_HOOK_SECRET");
      return new Response('Hook secret not configured', { status: 500 })
    }
    
    const wh = new Webhook(hookSecret)
    
    const {
      user,
      email_data: { token, token_hash, redirect_to, email_action_type },
    } = wh.verify(payload, headers) as {
      user: {
        email: string
      }
      email_data: {
        token: string
        token_hash: string
        redirect_to: string
        email_action_type: string
        site_url: string
      }
    }

    console.log("✅ Webhook verified successfully");
    console.log("📧 Processing email for:", user.email);
    console.log("🔒 Action type:", email_action_type);

    // Só processar emails de recovery (redefinição de senha)
    if (email_action_type !== 'recovery') {
      console.log("⏭️ Skipping non-recovery email");
      return new Response(JSON.stringify({ skipped: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    console.log("🎨 Rendering beautiful email template...");

    const html = await renderAsync(
      React.createElement(PasswordResetEmail, {
        supabase_url: Deno.env.get('SUPABASE_URL') ?? '',
        token,
        token_hash,
        redirect_to,
        email_action_type,
        user_email: user.email,
      })
    )

    console.log("📮 Sending beautiful email via Resend...");

    const { data, error } = await resend.emails.send({
      from: 'TudoFaz Hub <noreply@tudofaz.com>',
      to: [user.email],
      subject: '🔑 Redefinir sua senha - TudoFaz Hub',
      html,
    })

    if (error) {
      console.error("❌ Error sending email:", error);
      throw error
    }

    console.log("✅ Beautiful password reset email sent successfully:", data?.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: data?.id,
        actionType: email_action_type 
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error("💥 Error in password reset webhook:", error);
    return new Response(
      JSON.stringify({
        error: {
          message: error.message,
        },
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
})