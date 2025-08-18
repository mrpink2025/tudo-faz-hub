import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Checkbox } from "@/components/ui/checkbox";
import { useRateLimit } from "@/hooks/useRateLimit";
import { loginSchema, signupSchema, type LoginInput, type SignupInput } from "@/lib/validationSchemas";
import { logger } from "@/utils/logger";
import { PasswordStrength } from "@/components/ui/password-strength";
const Auth = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useSupabaseAuth();
  const { isAdmin, loading: loadingRole } = useIsAdmin();
  const { checkRateLimit } = useRateLimit();
  const [tab, setTab] = useState<"entrar" | "cadastrar">("entrar");

  useEffect(() => {
    document.title = "Entrar ou Criar Conta - tudofaz";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Faça login ou crie sua conta no tudofaz para publicar e gerenciar anúncios.");
    const link = document.querySelector('link[rel="canonical"]') || document.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', window.location.href);
    if (!link.parentNode) document.head.appendChild(link);
  }, []);

  useEffect(() => {
    if (!session || loadingRole) return;
    const from = (location.state as any)?.from || "/";
    navigate(isAdmin ? "/admin" : from, { replace: true });
  }, [session, isAdmin, loadingRole, navigate, location.state]);

  const loginForm = useForm<LoginInput>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });
  const signupForm = useForm<SignupInput>({ resolver: zodResolver(signupSchema), defaultValues: { email: "", password: "", confirmPassword: "" } });

  const handleLogin = async (values: LoginInput) => {
    if (checkRateLimit('auth', values.email)) return;
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });
      
      if (error) {
        logger.error("Login failed", { error: error.message, email: values.email });
        toast({ title: "Erro ao entrar", description: error.message });
        return;
      }
      
      logger.info("User logged in successfully", { email: values.email });
      toast({ title: "Bem-vindo", description: "Login realizado com sucesso." });
      // Redirecionamento ocorrerá pelo efeito que verifica a role de admin
    } catch (err) {
      logger.error("Unexpected login error", { error: err, email: values.email });
      toast({ title: "Erro", description: "Erro inesperado ao fazer login" });
    }
  };

  const handleSignup = async (values: SignupInput) => {
    if (checkRateLimit('auth', values.email)) return;
    
    try {
      const redirectUrl = `${window.location.origin}/confirmar-email`;
      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: { emailRedirectTo: redirectUrl },
      });
      
      if (error) {
        logger.error("Signup failed", { error: error.message, email: values.email });
        toast({ title: "Erro ao cadastrar", description: error.message });
        return;
      }
      
      logger.info("User signed up successfully", { email: values.email });
      toast({ 
        title: "Verifique seu e-mail", 
        description: "Enviamos um link de confirmação para ativar sua conta." 
      });
      setTab("entrar");
    } catch (err) {
      logger.error("Unexpected signup error", { error: err, email: values.email });
      toast({ title: "Erro", description: "Erro inesperado ao criar conta" });
    }
  };

  return (
    <main className="container py-10">
      <header className="mb-6">
        <h1 className="font-display text-3xl">Entrar ou criar conta</h1>
        <p className="text-muted-foreground">Acesse sua conta para publicar e gerenciar anúncios.</p>
      </header>

      <section className="max-w-md">
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="entrar">Entrar</TabsTrigger>
            <TabsTrigger value="cadastrar">Cadastrar</TabsTrigger>
          </TabsList>

          <TabsContent value="entrar" className="mt-6">
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="grid gap-4">
                <FormField name="email" control={loginForm.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="seu@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="password" control={loginForm.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit">Entrar</Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="cadastrar" className="mt-6">
            <Form {...signupForm}>
              <form onSubmit={signupForm.handleSubmit(handleSignup)} className="grid gap-4">
                <FormField name="email" control={signupForm.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="seu@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="password" control={signupForm.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha *</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Digite sua senha" {...field} />
                    </FormControl>
                    <div className="text-xs text-muted-foreground mt-1 space-y-1">
                      <p>Sua senha deve conter:</p>
                      <PasswordStrength password={field.value || ""} />
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="confirmPassword" control={signupForm.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Senha *</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Digite a senha novamente" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit">Criar conta</Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </section>
    </main>
  );
};

export default Auth;
