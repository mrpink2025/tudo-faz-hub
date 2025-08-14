import { useEffect, useMemo } from "react";
import { useLocation, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/utils/logger";

const PaymentSuccess = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const location = useLocation();
  const sessionId = useMemo(() => new URLSearchParams(location.search).get("session_id"), [location.search]);

  useEffect(() => {
    document.title = t("credits.successTitle");
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", t("credits.successDescription"));
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", window.location.origin + "/pagamento-sucesso");
  }, [t]);

  const verify = async () => {
    if (!sessionId) {
      toast({ title: t("common.error", { defaultValue: "Erro" }), description: "session_id ausente" });
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke("verify-payment-credits", {
        body: { session_id: sessionId },
      });
      if (error) throw error;
      toast({ title: t("credits.verified", { defaultValue: "Créditos adicionados" }), description: data?.message ?? "OK" });
    } catch (err: any) {
      logger.error("verify-payment-credits error", { error: err, sessionId });
      toast({ title: t("common.error", { defaultValue: "Erro" }), description: err.message ?? String(err) });
    }
  };

  return (
    <main>
      <section className="container py-10 space-y-6 text-center">
        <h1 className="font-display text-3xl">{t("credits.successTitle")}</h1>
        <p className="text-muted-foreground">{t("credits.successDescription")}</p>
        <div className="flex items-center justify-center gap-3">
          <Button onClick={verify}>{t("credits.verifyButton")}</Button>
          <Link to="/creditos"><Button variant="outline">{t("credits.backToCredits", { defaultValue: "Voltar aos créditos" })}</Button></Link>
        </div>
      </section>
    </main>
  );
};

export default PaymentSuccess;
