import React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface PasswordResetEmailProps {
  supabase_url: string
  email_action_type: string
  redirect_to: string
  token_hash: string
  token: string
  user_email: string
}

export const PasswordResetEmail = ({
  token_hash,
  supabase_url,
  email_action_type,
  redirect_to,
  user_email,
}: PasswordResetEmailProps) => {
  const resetUrl = `${supabase_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`
  
  return (
    <Html>
      <Head />
      <Preview>Redefinir sua senha - TudoFaz Hub</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header com gradiente */}
          <div style={header}>
            <Heading style={h1}>🔑 TudoFaz Hub</Heading>
            <Text style={headerText}>Redefinição de Senha</Text>
          </div>
          
          {/* Conteúdo principal */}
          <div style={content}>
            <Heading style={h2}>Esqueceu sua senha?</Heading>
            
            <Text style={text}>
              Não se preocupe! Recebemos uma solicitação para redefinir a senha da sua conta no TudoFaz Hub.
            </Text>
            
            <Text style={text}>
              Clique no botão abaixo para criar uma nova senha:
            </Text>
            
            {/* Botão principal */}
            <div style={buttonContainer}>
              <Link href={resetUrl} style={button}>
                🔒 Redefinir Minha Senha
              </Link>
            </div>
            
            <Text style={smallText}>
              Se o botão não funcionar, copie e cole este link no seu navegador:
            </Text>
            
            {/* Link em código */}
            <div style={codeContainer}>
              <code style={code}>{resetUrl}</code>
            </div>
            
            {/* Avisos de segurança */}
            <div style={warningBox}>
              <Text style={warningText}>
                ⚠️ <strong>Importante:</strong> Este link expira em 1 hora por motivos de segurança. Se não foi você quem solicitou esta redefinição, pode ignorar este email com segurança.
              </Text>
            </div>
            
            <div style={infoBox}>
              <Text style={infoText}>
                🛡️ <strong>Segurança:</strong> Este link é único e só pode ser usado uma vez. Após redefinir sua senha, o link será automaticamente invalidado.
              </Text>
            </div>
          </div>
          
          {/* Footer */}
          <div style={footer}>
            <Text style={footerText}>
              Este email foi enviado pelo TudoFaz Hub
            </Text>
            <Text style={footerSubText}>
              Se você tem dúvidas, entre em contato conosco.
            </Text>
          </div>
        </Container>
      </Body>
    </Html>
  )
}

export default PasswordResetEmail

// Estilos
const main = {
  backgroundColor: '#f8f9fa',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  margin: '0',
  padding: '0',
}

const container = {
  maxWidth: '600px',
  margin: '0 auto',
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  overflow: 'hidden',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
}

const header = {
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  padding: '40px 30px',
  textAlign: 'center' as const,
}

const h1 = {
  margin: '0',
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 'bold',
}

const headerText = {
  margin: '8px 0 0 0',
  color: '#ffffff',
  opacity: '0.9',
  fontSize: '16px',
}

const content = {
  padding: '40px 30px',
}

const h2 = {
  margin: '0 0 20px 0',
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: '600',
}

const text = {
  margin: '0 0 20px 0',
  color: '#4a4a4a',
  fontSize: '16px',
  lineHeight: '1.6',
}

const smallText = {
  margin: '30px 0 20px 0',
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '1.6',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '30px 0',
}

const button = {
  display: 'inline-block',
  padding: '16px 32px',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: '#ffffff',
  textDecoration: 'none',
  fontWeight: '600',
  fontSize: '16px',
  borderRadius: '8px',
}

const codeContainer = {
  backgroundColor: '#f3f4f6',
  padding: '15px',
  borderRadius: '6px',
  borderLeft: '4px solid #667eea',
  margin: '20px 0',
  wordBreak: 'break-all' as const,
}

const code = {
  color: '#374151',
  fontSize: '14px',
  fontFamily: 'monospace',
}

const warningBox = {
  margin: '30px 0',
  padding: '20px',
  backgroundColor: '#fef3c7',
  borderRadius: '8px',
  borderLeft: '4px solid #f59e0b',
}

const warningText = {
  margin: '0',
  color: '#92400e',
  fontSize: '14px',
  lineHeight: '1.5',
}

const infoBox = {
  margin: '30px 0',
  padding: '20px',
  backgroundColor: '#dbeafe',
  borderRadius: '8px',
  borderLeft: '4px solid #3b82f6',
}

const infoText = {
  margin: '0',
  color: '#1e40af',
  fontSize: '14px',
  lineHeight: '1.5',
}

const footer = {
  backgroundColor: '#f8f9fa',
  padding: '30px',
  textAlign: 'center' as const,
  borderTop: '1px solid #e5e7eb',
}

const footerText = {
  margin: '0 0 10px 0',
  color: '#6b7280',
  fontSize: '14px',
}

const footerSubText = {
  margin: '0',
  color: '#9ca3af',
  fontSize: '12px',
}