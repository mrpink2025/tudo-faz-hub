import { Button } from "@/components/ui/button";
import SearchBar from "@/components/SearchBar";
import hero from "@/assets/hero-tudofaz.jpg";
import { Link } from "react-router-dom";

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
          <h1 className="font-display text-4xl lg:text-5xl tracking-tight bg-[var(--gradient-primary)] bg-clip-text text-transparent">
            Encontre, compre e contrate em um só lugar
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
