import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const formatBRL = (value: number, locale: string) =>
  new Intl.NumberFormat(locale === "pt" ? "pt-BR" : locale, { style: "currency", currency: "BRL" }).format(value / 100);

const packs = [
  { id: "credits_100", credits: 100, price: 990 },
  { id: "credits_300", credits: 300, price: 2490 },
  { id: "credits_1200", credits: 1200, price: 7990 },
] as const;

const Credits = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const locale = useMemo(() => i18n.language?.split("-")[0] ?? "pt", [i18n.language]);

  useEffect(() => {
    document.title = t("credits.title");
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", t("credits.description"));
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", window.location.origin + "/creditos");
  }, [t]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const { data, error } = await supabase
        .from("user_wallets")
        .select("balance, currency")
        .maybeSingle();
      if (error) {
        console.warn("wallet fetch error", error.message);
      }
      if (isMounted) {
        setBalance(data?.balance ?? 0);
        setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const startCheckout = async (packId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("create-payment-credits", {
        body: { packId },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      console.error("create-payment-credits error", err);
      toast({ title: t("common.error", { defaultValue: "Erro" }), description: err.message ?? String(err) });
    }
  };

  return (
    <main>
      <section className="container py-10 space-y-6">
        <header>
          <h1 className="font-display text-3xl">{t("credits.title")}</h1>
          <p className="text-muted-foreground">{t("credits.description")}</p>
        </header>

        <article className="rounded-lg border bg-card p-6">
          <div className="flex items-end gap-3">
            <span className="text-sm text-muted-foreground">{t("credits.balance")}:</span>
            <strong className="text-2xl tabular-nums">{loading ? t("common.loading") : `${balance} ${t("credits.packUnit", { defaultValue: "créditos" })}`}</strong>
          </div>
        </article>

        <section aria-labelledby="packs-heading" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <h2 id="packs-heading" className="sr-only">{t("credits.packsTitle")}</h2>
          {packs.map((p) => (
            <Card key={p.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{t("credits.packLabel", { credits: p.credits })}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-3xl font-semibold">{formatBRL(p.price, locale)}</p>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={() => startCheckout(p.id)}>
                  {t("credits.buy")}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </section>
      </section>
    </main>
  );
};

export default Credits;
