import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
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
import { useRateLimit } from "@/hooks/useRateLimit";
import { loginSchema, signupSchema, type LoginInput, type SignupInput } from "@/lib/validationSchemas";
import { logger } from "@/utils/logger";
import { PasswordStrength } from "@/components/ui/password-strength";
import { useTranslation } from "react-i18next";

const Auth = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useSupabaseAuth();
  const { isAdmin, loading: loadingRole } = useIsAdmin();
  const { checkRateLimit } = useRateLimit();
  const { t } = useTranslation();
  const [tab, setTab] = useState<"entrar" | "cadastrar">("entrar");

  useEffect(() => {
    document.title = t("auth_page.title") + " - tudofaz";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", t("auth_page.subtitle"));
    const link = document.querySelector('link[rel="canonical"]') || document.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', window.location.href);
    if (!link.parentNode) document.head.appendChild(link);
  }, [t]);

  useEffect(() => {
    if (!session || loadingRole) return;
    const from = (location.state as any)?.from || "/";
    navigate(isAdmin ? "/admin" : from, { replace: true });
  }, [session, isAdmin, loadingRole, navigate, location.state]);

  const loginForm = useForm<LoginInput>({ 
    resolver: zodResolver(loginSchema), 
    defaultValues: { email: "", password: "" } 
  });
  
  const signupForm = useForm<SignupInput>({ 
    resolver: zodResolver(signupSchema), 
    defaultValues: { 
      email: "", 
      password: "", 
      confirmPassword: "",
      firstName: "",
      lastName: "",
      cpf: ""
    } 
  });

  const handleLogin = async (values: LoginInput) => {
    if (checkRateLimit('auth', values.email)) return;
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });
      
      if (error) {
        logger.error("Login failed", { error: error.message, email: values.email });
        toast({ title: t("auth_page.login_error"), description: error.message });
        return;
      }
      
      logger.info("User logged in successfully", { email: values.email });
      toast({ title: t("auth_page.welcome"), description: t("auth_page.login_success") });
    } catch (err) {
      logger.error("Unexpected login error", { error: err, email: values.email });
      toast({ title: t("auth_page.general_error"), description: t("auth_page.unexpected_login") });
    }
  };

  const handleSignup = async (values: SignupInput) => {
    if (checkRateLimit('auth', values.email)) return;
    
    try {
      const redirectUrl = `${window.location.origin}/confirmar-email`;
      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: { 
          emailRedirectTo: redirectUrl,
          data: {
            first_name: values.firstName,
            last_name: values.lastName,
            cpf: values.cpf,
            full_name: `${values.firstName} ${values.lastName}`
          }
        },
      });
      
      if (error) {
        logger.error("Signup failed", { error: error.message, email: values.email });
        if (error.message?.includes('cpf')) {
          toast({ title: t("auth_page.signup_error"), description: "CPF já está em uso" });
        } else {
          toast({ title: t("auth_page.signup_error"), description: error.message });
        }
        return;
      }
      
      logger.info("User signed up successfully", { email: values.email });
      toast({ 
        title: t("auth_page.verify_email"), 
        description: t("auth_page.verify_email_desc")
      });
      setTab("entrar");
    } catch (err) {
      logger.error("Unexpected signup error", { error: err, email: values.email });
      toast({ title: t("auth_page.general_error"), description: t("auth_page.unexpected_signup") });
    }
  };

  return (
    <main className="container py-10">
      <header className="mb-6">
        <h1 className="font-display text-3xl">{t("auth_page.title")}</h1>
        <p className="text-muted-foreground">{t("auth_page.subtitle")}</p>
      </header>

      <section className="max-w-md">
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="entrar">{t("auth_page.login_tab")}</TabsTrigger>
            <TabsTrigger value="cadastrar">{t("auth_page.signup_tab")}</TabsTrigger>
          </TabsList>

          <TabsContent value="entrar" className="mt-6">
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="grid gap-4">
                <FormField name="email" control={loginForm.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.email")}</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder={t("form.email_placeholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="password" control={loginForm.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.password")}</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder={t("form.password_placeholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                
                <div className="flex items-center justify-between">
                  <Link 
                    to="/esqueceu-senha" 
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Esqueceu a senha?
                  </Link>
                </div>
                
                <Button type="submit">{t("auth_page.login_button")}</Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="cadastrar" className="mt-6">
            <Form {...signupForm}>
              <form onSubmit={signupForm.handleSubmit(handleSignup)} className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField name="firstName" control={signupForm.control} render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("form.first_name")} *</FormLabel>
                      <FormControl>
                        <Input type="text" placeholder={t("form.first_name_placeholder")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField name="lastName" control={signupForm.control} render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("form.last_name")} *</FormLabel>
                      <FormControl>
                        <Input type="text" placeholder={t("form.last_name_placeholder")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                
                <FormField name="cpf" control={signupForm.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.cpf")} *</FormLabel>
                    <FormControl>
                      <Input 
                        type="text" 
                        placeholder={t("form.cpf_placeholder")} 
                        maxLength={11}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                
                <FormField name="email" control={signupForm.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.email")} *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder={t("form.email_placeholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                
                <FormField name="password" control={signupForm.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.password")} *</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder={t("form.password_signup_placeholder")} {...field} />
                    </FormControl>
                    <div className="text-xs text-muted-foreground mt-1 space-y-1">
                      <p>{t("auth_page.password_requirements")}</p>
                      <PasswordStrength password={field.value || ""} />
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />
                
                <FormField name="confirmPassword" control={signupForm.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.confirm_password")} *</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder={t("form.password_confirm_placeholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                
                <Button type="submit">{t("auth_page.signup_button")}</Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </section>
    </main>
  );
};

export default Auth;