import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";

const PromoCTA = () => {
  return (
    <section aria-label="Promoção de anúncios" className="py-10">
      <h1
        className="container rounded-2xl border shadow"
        style={{
          backgroundImage: "var(--gradient-primary)",
        }}
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
    </section>
  );
};

export default PromoCTA;
