import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

const PaymentCanceled = () => {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = t("credits.cancelTitle");
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", t("credits.cancelDescription"));
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", window.location.origin + "/pagamento-cancelado");
  }, [t]);

  return (
    <main>
      <section className="container py-10 space-y-6 text-center">
        <h1 className="font-display text-3xl">{t("credits.cancelTitle")}</h1>
        <p className="text-muted-foreground">{t("credits.cancelDescription")}</p>
        <Link to="/creditos"><Button variant="outline">{t("credits.backToCredits", { defaultValue: "Voltar aos créditos" })}</Button></Link>
      </section>
    </main>
  );
};

export default PaymentCanceled;
