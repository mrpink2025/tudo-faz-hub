import { useEffect } from "react";
import Hero from "@/components/home/Hero";
import Categories from "@/components/home/Categories";
import SignatureGlow from "@/components/home/SignatureGlow";
import FeaturedListingsSection from "@/components/listings/FeaturedListingsSection";
import NearbyListingsSection from "@/components/listings/NearbyListingsSection";
import { useTranslation } from "react-i18next";

const Index = () => {
  const { t } = useTranslation();
  useEffect(() => {
    document.title = t("index.title");
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", t("index.description"));
  }, [t]);

  return (
    <main>
      <SignatureGlow />
      <Hero />
      <NearbyListingsSection />
      <FeaturedListingsSection limit={6} />
      <Categories />
      <section className="py-16" style={{ backgroundImage: "var(--gradient-subtle)" }}>
        <div className="container text-center space-y-3">
          <h2 className="font-display text-2xl">Pronto para começar?</h2>
          <p className="text-muted-foreground">Publique seu primeiro anúncio em menos de 2 minutos.</p>
        </div>
      </section>
    </main>
  );
};

export default Index;
