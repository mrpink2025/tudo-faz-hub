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
        console.log('🔗 SearchParams:', Object.fromEntries(searchParams.entries()));
        
        // Verificar se há parâmetros de auth na URL (do email do Supabase)
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');
        const type = searchParams.get('type');
        
        console.log('🎫 Tokens da URL:', { accessToken: !!accessToken, refreshToken: !!refreshToken, type });
        
        // Se há tokens na URL, definir sessão do Supabase
        if (accessToken && refreshToken && type === 'recovery') {
          console.log('🔄 Estabelecendo sessão com tokens da URL...');
          
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (error) {
            console.error('❌ Erro ao estabelecer sessão:', error);
            toast({
              title: "Link inválido",
              description: "Token de redefinição inválido ou expirado. Solicite um novo link de redefinição.",
              variant: "destructive",
            });
            navigate("/esqueceu-senha");
            return;
          }
          
          console.log('✅ Sessão estabelecida com sucesso:', !!data.session);
          setIsValidSession(true);
          return;
        }
        
        // Caso contrário, verificar sessão existente
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log('📋 Dados da sessão existente:', { 
          hasSession: !!session, 
          hasUser: !!session?.user,
          error: error?.message 
        });
        
        if (error) {
          console.error('❌ Erro ao verificar sessão:', error);
          toast({
            title: "Erro na sessão",
            description: "Não foi possível verificar a sessão. Tente novamente.",
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
          console.log('❌ Nenhuma sessão válida encontrada');
          toast({
            title: "Acesso negado",
            description: "Use o link de redefinição enviado por email para acessar esta página.",
            variant: "destructive",
          });
          navigate("/esqueceu-senha");
        }
      } catch (error) {
        console.error('💥 Erro inesperado ao verificar sessão:', error);
        toast({
          title: "Erro inesperado",
          description: "Tente novamente mais tarde.",
          variant: "destructive",
        });
        navigate("/esqueceu-senha");
      }
    };

    // Adicionar delay para garantir que os parâmetros da URL sejam processados
    const timer = setTimeout(checkSession, 100);
    
    return () => clearTimeout(timer);
  }, [navigate, toast, searchParams]);

  const handleUpdatePassword = async (values: NewPasswordInput) => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: values.password,
      });

      if (error) {
        toast({
          title: "Erro ao atualizar senha",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

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
      toast({
        title: "Erro inesperado",
        description: "Tente novamente mais tarde.",
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