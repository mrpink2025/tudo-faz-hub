import { useEffect } from "react";
import Hero from "@/components/home/Hero";
import Categories from "@/components/home/Categories";
import SignatureGlow from "@/components/home/SignatureGlow";

const Index = () => {
  useEffect(() => {
    document.title = "tudofaz.com — Marketplace local completo";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Compre, venda e contrate serviços locais no tudofaz.com.");
  }, []);

  return (
    <main>
      <SignatureGlow />
      <Hero />
      <Categories />
      <section className="py-16 bg-[var(--gradient-subtle)]">
        <div className="container text-center space-y-3">
          <h2 className="font-display text-2xl">Pronto para começar?</h2>
          <p className="text-muted-foreground">Publique seu primeiro anúncio em menos de 2 minutos.</p>
        </div>
      </section>
    </main>
  );
};

export default Index;
