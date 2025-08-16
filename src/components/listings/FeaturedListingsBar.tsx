import { Link } from "react-router-dom";
import { useFeaturedListings } from "@/hooks/useFeaturedListings";
import { useTranslation } from "react-i18next";

const formatPrice = (
  value: number | null | undefined,
  currency: string | null | undefined,
  fallback: string,
  locale: string
) => {
  if (value == null) return fallback;
  try {
    // Converter centavos para reais e formatar no padrão brasileiro
    const valueInReais = value / 100;
    return new Intl.NumberFormat('pt-BR', { 
      style: "currency", 
      currency: currency || "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(valueInReais);
  } catch {
    return `R$ ${(value / 100).toFixed(2).replace('.', ',')}`;
  }
};

const FeaturedListingsBar = () => {
  const { t, i18n } = useTranslation();
  const { data: listings = [] } = useFeaturedListings(12);
  if (!listings.length) return null;
  const locale = i18n.language || "pt-BR";

  return (
    <aside aria-label="Anúncios em destaque" className="bg-accent/40 border-b">
      <div className="container py-2 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {listings.map((l) => (
            <Link
              key={l.id}
              to={`/anuncio/${l.id}`}
              className="inline-flex items-center gap-2 rounded-md border bg-background px-3 py-1 text-xs hover:bg-accent hover:text-accent-foreground transition-colors whitespace-nowrap"
              aria-label={`Ver anúncio em destaque: ${l.title}`}
            >
              <span className="line-clamp-1 max-w-[18ch]">{l.title}</span>
              <span className="text-muted-foreground">{formatPrice(l.price, l.currency, t("price.combined"), locale)}</span>
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default FeaturedListingsBar;
