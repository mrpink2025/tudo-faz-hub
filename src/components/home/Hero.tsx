import { Button } from "@/components/ui/button";
import SearchBar from "@/components/SearchBar";
import hero from "@/assets/hero-tudofaz.jpg";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";

const Hero = () => {
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
            Seu marketplace local completo
          </span>
          <h1
            className="container rounded-2xl border shadow"
            style={{ backgroundImage: "var(--gradient-primary)" }}
          >
            <div className="grid gap-6 p-8 md:grid-cols-2 md:p-12 text-[hsl(var(--hero-foreground))]">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Promova seu anúncio</span>
                </div>
                <div className="font-display text-2xl md:text-3xl leading-tight">
                  Destaque seu anúncio e alcance muito mais pessoas
                </div>
                <p className="text-sm/6 md:text-base opacity-90">
                  Anúncios destacados ganham prioridade de exibição. Publique agora e ative o destaque para resultados mais rápidos.
                </p>
              </div>

              <div className="flex items-center gap-3 md:justify-end">
                <Link
                  to="/publicar"
                  className="inline-flex items-center gap-2 rounded-md bg-[hsl(var(--primary-foreground))] px-4 py-2 text-[hsl(var(--primary))] hover:opacity-90 transition"
                >
                  Publicar anúncio
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/entrar"
                  className="inline-flex items-center gap-2 rounded-md border border-white/40 px-4 py-2 hover:bg-white/10 transition"
                  title="Faça login para gerenciar créditos e destaque"
                >
                  Depositar para destacar
                </Link>
              </div>
            </div>
          </h1>
          <p className="text-muted-foreground text-base lg:text-lg max-w-prose">
            Produtos, serviços, empregos, imóveis e muito mais próximos de você. Publique anúncios em minutos e alcance sua comunidade.
          </p>
          <SearchBar />
          <div className="flex items-center gap-3">
            <Link to="/publicar">
              <Button variant="hero" size="xl">Publicar anúncio</Button>
            </Link>
            <Link to="/explorar">
              <Button variant="soft" size="xl">Explorar</Button>
            </Link>
          </div>
        </div>
        <div className="relative">
          <img
            src={hero}
            alt="Ilustração representando compras e serviços locais"
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
