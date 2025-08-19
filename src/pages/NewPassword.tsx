import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Lock, CheckCircle } from "lucide-react";
import { PasswordStrength } from "@/components/ui/password-strength";

const newPasswordSchema = z.object({
  password: z.string()
    .min(8, "Senha deve ter pelo menos 8 caracteres")
    .regex(/[A-Z]/, "Senha deve ter pelo menos uma letra maiúscula")
    .regex(/[a-z]/, "Senha deve ter pelo menos uma letra minúscula")
    .regex(/[0-9]/, "Senha deve ter pelo menos um número"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});

type NewPasswordInput = z.infer<typeof newPasswordSchema>;

const NewPassword = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);

  const form = useForm<NewPasswordInput>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { 
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    // Verificar se há uma sessão de redefinição de senha válida
    const checkSession = async () => {
      try {
        console.log('🔍 Verificando sessão para redefinição de senha...');
        console.log('📍 URL atual:', window.location.href);
        
        // Verificar se a URL veio com erro (token expirado)
        const hash = window.location.hash;
        const urlParams = new URLSearchParams(hash.substring(1)); // Remove o #
        const searchParams = new URLSearchParams(window.location.search);
        
        // Verificar erros tanto no hash quanto nos query params
        const error = urlParams.get('error') || searchParams.get('error');
        const errorCode = urlParams.get('error_code') || searchParams.get('error_code');
        const errorDescription = urlParams.get('error_description') || searchParams.get('error_description');
        
        console.log('🎫 Dados da URL:', { 
          hash,
          error,
          errorCode,
          errorDescription,
          searchParamsEntries: Object.fromEntries(searchParams.entries()),
          hashParamsEntries: Object.fromEntries(urlParams.entries())
        });
        
        // Se há erro na URL (token expirado, etc.)
        if (error || errorCode) {
          console.error('❌ Erro detectado na URL:', { error, errorCode, errorDescription });
          
          // Limpar a URL do erro
          window.history.replaceState({}, document.title, '/nova-senha');
          
          let userMessage = "Link de redefinição inválido ou expirado.";
          
          if (errorCode === 'otp_expired' || error === 'access_denied') {
            userMessage = "O link de redefinição expirou rapidamente. Este é um problema conhecido do Supabase.";
          }
          
          toast({
            title: "Token Expirado",
            description: `${userMessage} Solicite um novo link e tente usar mais rapidamente.`,
            variant: "destructive",
          });
          
          // Aguardar um pouco antes de redirecionar para que o usuário veja a mensagem
          setTimeout(() => {
            navigate("/esqueceu-senha");
          }, 3000);
          return;
        }
        
        // Verificar tokens válidos na URL
        const accessToken = urlParams.get('access_token') || searchParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token') || searchParams.get('refresh_token');
        const type = urlParams.get('type') || searchParams.get('type');
        
        console.log('🔑 Tokens encontrados:', { 
          hasAccessToken: !!accessToken, 
          hasRefreshToken: !!refreshToken, 
          type 
        });
        
        // Se há tokens na URL, tentar estabelecer sessão
        if (accessToken && refreshToken && (type === 'recovery' || type === 'magiclink')) {
          console.log('🔄 Estabelecendo sessão com tokens da URL...');
          
          try {
            const { data, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
            
            if (sessionError) {
              console.error('❌ Erro ao estabelecer sessão:', sessionError);
              throw sessionError;
            }
            
            console.log('✅ Sessão estabelecida com sucesso:', !!data.session);
            
            // Limpar tokens da URL por segurança
            window.history.replaceState({}, document.title, '/nova-senha');
            
            setIsValidSession(true);
            return;
          } catch (sessionError) {
            console.error('💥 Falha ao estabelecer sessão:', sessionError);
            toast({
              title: "Token Inválido",
              description: "Não foi possível validar o token. Solicite um novo link.",
              variant: "destructive",
            });
            navigate("/esqueceu-senha");
            return;
          }
        }
        
        // Caso contrário, verificar sessão existente
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        console.log('📋 Verificando sessão existente:', { 
          hasSession: !!session, 
          hasUser: !!session?.user,
          hasAccessToken: !!session?.access_token,
          error: sessionError?.message 
        });
        
        if (sessionError) {
          console.error('❌ Erro ao verificar sessão:', sessionError);
          toast({
            title: "Erro na sessão",
            description: "Erro ao verificar sessão. Use o link do email.",
            variant: "destructive",
          });
          navigate("/esqueceu-senha");
          return;
        }

        // Verificar se existe uma sessão válida
        if (session && session.user && session.access_token) {
          console.log('✅ Sessão válida encontrada');
          setIsValidSession(true);
        } else {
          console.log('❌ Nenhuma sessão válida - redirecionando');
          toast({
            title: "Acesso Negado",
            description: "Use o link do email de redefinição para acessar esta página.",
            variant: "destructive",
          });
          navigate("/esqueceu-senha");
        }
      } catch (error) {
        console.error('💥 Erro inesperado ao verificar sessão:', error);
        toast({
          title: "Erro inesperado",
          description: "Tente novamente ou solicite um novo link.",
          variant: "destructive",
        });
        navigate("/esqueceu-senha");
      }
    };

    // Pequeno delay para garantir que a URL seja processada
    const timer = setTimeout(checkSession, 200);
    
    return () => clearTimeout(timer);
  }, [navigate, toast, searchParams]);

  const handleUpdatePassword = async (values: NewPasswordInput) => {
    setIsLoading(true);
    
    try {
      // Verificar se ainda temos uma sessão válida antes de atualizar
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session || !session.access_token) {
        toast({
          title: "Sessão expirada",
          description: "Sua sessão de redefinição expirou. Solicite um novo link.",
          variant: "destructive",
        });
        navigate("/esqueceu-senha");
        return;
      }

      console.log('🔄 Atualizando senha com sessão válida');

      const { error } = await supabase.auth.updateUser({
        password: values.password,
      });

      if (error) {
        if (error.message.includes('session_not_found') || error.message.includes('expired')) {
          toast({
            title: "Sessão expirada",
            description: "O token de redefinição expirou. Solicite um novo link.",
            variant: "destructive",
          });
          navigate("/esqueceu-senha");
          return;
        }
        
        toast({
          title: "Erro ao atualizar senha",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Senha atualizada com sucesso');

      toast({
        title: "Senha atualizada!",
        description: "Sua senha foi redefinida com sucesso. Você será redirecionado para fazer login.",
      });

      // Fazer logout da sessão de reset e redirecionar para login
      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate("/entrar");
      }, 2000);
    } catch (error: any) {
      console.error('💥 Erro ao atualizar senha:', error);
      toast({
        title: "Erro inesperado",
        description: "Tente novamente ou solicite um novo link de redefinição.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isValidSession) {
    return (
      <main className="container py-10 max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Verificando sessão...</CardTitle>
          </CardHeader>
        </Card>
      </main>
    );
  }

  return (
    <main className="container py-10 max-w-md mx-auto">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Redefinir Senha</CardTitle>
          <CardDescription>
            Digite sua nova senha abaixo.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleUpdatePassword)} className="space-y-4">
              <FormField
                name="password"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova Senha</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Digite sua nova senha"
                        {...field}
                      />
                    </FormControl>
                    <div className="text-xs text-muted-foreground mt-1 space-y-1">
                      <p>A senha deve conter:</p>
                      <PasswordStrength password={field.value || ""} />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                name="confirmPassword"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Nova Senha</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Confirme sua nova senha"
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
                    Atualizando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Atualizar Senha
                  </div>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
};

export default NewPassword;