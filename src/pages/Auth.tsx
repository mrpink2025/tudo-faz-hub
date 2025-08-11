import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

const emailSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Mínimo de 6 caracteres"),
});

type EmailForm = z.infer<typeof emailSchema>;

const Auth = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useSupabaseAuth();
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
    if (session) {
      const from = (location.state as any)?.from || "/";
      navigate(from, { replace: true });
    }
  }, [session, navigate, location.state]);

  const loginForm = useForm<EmailForm>({ resolver: zodResolver(emailSchema), defaultValues: { email: "", password: "" } });
  const signupForm = useForm<EmailForm>({ resolver: zodResolver(emailSchema), defaultValues: { email: "", password: "" } });

  const handleLogin = async (values: EmailForm) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });
    if (error) {
      toast({ title: "Erro ao entrar", description: error.message });
      return;
    }
    toast({ title: "Bem-vindo", description: "Login realizado com sucesso." });
    const from = (location.state as any)?.from || "/";
    navigate(from, { replace: true });
  };

  const handleSignup = async (values: EmailForm) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: { emailRedirectTo: redirectUrl },
    });
    if (error) {
      toast({ title: "Erro ao cadastrar", description: error.message });
      return;
    }
    toast({ title: "Verifique seu e-mail", description: "Enviamos um link de confirmação." });
    setTab("entrar");
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
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Mínimo 6 caracteres" {...field} />
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
