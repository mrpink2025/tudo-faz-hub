import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

const EmailConfirmation = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");
    const type = searchParams.get("type");
    
    if (!token || !type) {
      setStatus("error");
      setErrorMessage("Link de confirmação inválido");
      return;
    }

    const verifyEmail = async () => {
      try {
        // Use exchangeCodeForSession instead of verifyOtp for email confirmation
        const { error } = await supabase.auth.exchangeCodeForSession(token);

        if (error) {
          setStatus("error");
          setErrorMessage(error.message);
          toast({
            title: "Erro na confirmação",
            description: error.message,
            variant: "destructive",
          });
        } else {
          setStatus("success");
          toast({
            title: "Email confirmado!",
            description: "Sua conta foi ativada com sucesso.",
          });
          
          // Redirecionar para a página inicial após 3 segundos
          setTimeout(() => {
            navigate("/", { replace: true });
          }, 3000);
        }
      } catch (error) {
        setStatus("error");
        setErrorMessage("Erro interno do servidor");
        toast({
          title: "Erro na confirmação",
          description: "Ocorreu um erro inesperado. Tente novamente.",
          variant: "destructive",
        });
      }
    };

    verifyEmail();
  }, [searchParams, toast, navigate]);

  useEffect(() => {
    document.title = "Confirmação de Email - tudofaz";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Confirme seu email para ativar sua conta no tudofaz.");
  }, []);

  return (
    <main className="container py-20">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {status === "loading" && (
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
              )}
              {status === "success" && (
                <CheckCircle className="h-12 w-12 text-green-500" />
              )}
              {status === "error" && (
                <XCircle className="h-12 w-12 text-red-500" />
              )}
            </div>
            <CardTitle className="text-2xl">
              {status === "loading" && "Confirmando email..."}
              {status === "success" && "Email confirmado!"}
              {status === "error" && "Erro na confirmação"}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="text-center space-y-4">
            {status === "loading" && (
              <p className="text-muted-foreground">
                Aguarde enquanto confirmamos seu email...
              </p>
            )}
            
            {status === "success" && (
              <>
                <p className="text-muted-foreground">
                  Sua conta foi ativada com sucesso! Você será redirecionado automaticamente.
                </p>
                <Button onClick={() => navigate("/", { replace: true })} className="w-full">
                  Ir para página inicial
                </Button>
              </>
            )}
            
            {status === "error" && (
              <>
                <p className="text-muted-foreground">
                  {errorMessage || "Não foi possível confirmar seu email."}
                </p>
                <div className="space-y-2">
                  <Button onClick={() => navigate("/entrar")} className="w-full">
                    Ir para login
                  </Button>
                  <Button 
                    onClick={() => window.location.reload()} 
                    variant="outline" 
                    className="w-full"
                  >
                    Tentar novamente
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default EmailConfirmation;