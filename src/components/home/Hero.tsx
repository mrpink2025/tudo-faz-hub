import { Button } from "@/components/ui/button";
import SearchBar from "@/components/SearchBar";
import heroDefault from "@/assets/hero-blue.jpg";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
const Hero = () => {
  const { t } = useTranslation();
  
  const { data: settings } = useQuery({
    queryKey: ["site-settings-public"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_site_settings_public");
      if (error) throw error;
      return data?.[0] || null;
    },
  });

  const heroImage = settings?.hero_image_url || heroDefault;
  return (
    <section className="relative overflow-hidden bg-[var(--gradient-subtle)]">
      {/* Subtle brand glow background */}
      <div
        className="absolute inset-0 -z-10 bg-[var(--gradient-primary)]/8 dark:bg-[var(--gradient-primary)]/12 blur-3xl"
        aria-hidden="true"
      />

      <div className="container py-16 lg:py-24 grid gap-10 lg:grid-cols-2 items-center">
        <div className="space-y-6 relative z-10">
          <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs text-muted-foreground">
            {t("home.tagline_small")}
          </span>
          <h1
            className="container max-w-4xl rounded-2xl border shadow"
            style={{ backgroundImage: "var(--gradient-primary)" }}
          >
            <div className="grid gap-4 p-5 md:grid-cols-2 md:p-6 text-[hsl(var(--hero-foreground))]">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{t("promo.badge")}</span>
                </div>
                <div className="font-display text-lg md:text-xl leading-snug">
                  {t("promo.title")}
                </div>
                <p className="text-sm/6 md:text-base opacity-90">
                  {t("promo.desc")}
                </p>
              </div>

              <div className="flex items-center gap-3 md:justify-end">
                <Link
                  to="/publicar"
                  className="inline-flex items-center gap-2 rounded-md bg-[hsl(var(--primary-foreground))] px-4 py-2 text-[hsl(var(--primary))] hover:opacity-90 transition"
                >
                  {t("buttons.publish")}<ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/creditos"
                  className="inline-flex items-center gap-2 rounded-md border border-white/40 px-4 py-2 hover:bg-white/10 transition"
                  title={t("home.credit_tooltip")}
                >
                  {t("buttons.deposit_feature")}
                </Link>
              </div>
            </div>
          </h1>
          <p className="text-muted-foreground text-base lg:text-lg max-w-prose">
            {t("home.hero_description")}
          </p>
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
            <div className="flex-1">
              <SearchBar />
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <Link to="/explorar">
                <Button variant="soft" size="xl">{t("nav.explore")}</Button>
              </Link>
            </div>
          </div>
        </div>
        <div className="relative">
          <img
            src={heroImage}
            alt={t("images.alt_hero")}
            className="w-full rounded-xl shadow-xl animate-float"
            loading="lazy"
          />
          <div className="absolute -z-10 inset-0 bg-[var(--gradient-primary)] opacity-10 blur-3xl rounded-full" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
