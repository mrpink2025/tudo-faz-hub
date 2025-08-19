import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

const resetPasswordSchema = z.object({
  email: z.string().email("Email inválido"),
});

type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

const PasswordReset = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: "" },
  });

  useEffect(() => {
    document.title = "Recuperar Senha - TudoFaz Hub";
  }, []);

  const handleResetPassword = async (values: ResetPasswordInput) => {
    setIsLoading(true);
    
    try {
      const redirectUrl = `${window.location.origin}/nova-senha`;
      
      // Usar APENAS o Supabase nativo que gera tokens válidos
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        toast({
          title: "Erro ao enviar email",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      // Enviar email bonito via send-notification
      try {
        await supabase.functions.invoke('send-notification', {
          body: {
            to: values.email,
            subject: '🔑 Redefinir sua senha - TudoFaz Hub',
            message: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #1a365d; margin-bottom: 10px;">🔑 Redefinir Senha</h1>
                  <p style="color: #4a5568; font-size: 16px;">Recebemos uma solicitação para redefinir sua senha</p>
                </div>
                
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px; text-align: center; margin: 20px 0;">
                  <p style="color: white; margin-bottom: 20px; font-size: 16px;">📧 Verifique sua caixa de entrada!</p>
                  <p style="color: #f7fafc; font-size: 14px; margin-bottom: 0;">Você receberá um email oficial do Supabase com o link funcional para redefinir sua senha.</p>
                </div>
                
                <div style="background: #f7fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #4299e1;">
                  <p style="margin: 0; color: #2d3748; font-size: 14px;">
                    <strong>📧 Importante:</strong> Use o link do email oficial do Supabase (não de resposta) para redefinir sua senha com segurança.
                  </p>
                </div>
                
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                  <p style="color: #718096; font-size: 12px; margin: 0;">
                    Se você não solicitou esta redefinição, pode ignorar este email com segurança.
                  </p>
                </div>
              </div>
            `,
            type: 'info'
          }
        });
        console.log("Email bonito enviado com sucesso");
      } catch (customEmailError) {
        console.warn("Email personalizado falhou, mas o nativo do Supabase funcionou:", customEmailError);
      }

      setEmailSent(true);
      toast({
        title: "Email enviado!",
        description: "Verifique sua caixa de entrada para redefinir sua senha. Use o email oficial do Supabase.",
      });
    } catch (error: any) {
      console.error("Password reset error:", error);
      toast({
        title: "Erro inesperado",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <main className="container py-10 max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Email Enviado!</CardTitle>
            <CardDescription>
              Enviamos um link para redefinir sua senha para o email fornecido.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                📧 Verifique sua caixa de entrada (e spam) e clique no link para redefinir sua senha.
              </p>
            </div>
            
            <div className="space-y-2">
              <Button 
                onClick={() => setEmailSent(false)}
                variant="outline"
                className="w-full"
              >
                Enviar novamente
              </Button>
              
              <Link to="/entrar" className="block">
                <Button variant="ghost" className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar ao login
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="container py-10 max-w-md mx-auto">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Esqueceu sua senha?</CardTitle>
          <CardDescription>
            Digite seu email e enviaremos um link para redefinir sua senha.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleResetPassword)} className="space-y-4">
              <FormField
                name="email"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="seu.email@exemplo.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Enviando...
                  </div>
                ) : (
                  "Enviar link de recuperação"
                )}
              </Button>
            </form>
          </Form>
          
          <div className="mt-6 text-center">
            <Link to="/entrar" className="text-sm text-muted-foreground hover:text-primary">
              <ArrowLeft className="h-4 w-4 inline mr-1" />
              Voltar ao login
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
};

export default PasswordReset;