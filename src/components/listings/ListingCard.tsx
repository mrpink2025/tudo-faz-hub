import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Heart } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { LazyImage } from "@/components/ui/lazy-image";

type Listing = {
  id: string;
  title: string;
  price: number | null;
  currency: string | null;
  location: string | null;
  created_at: string;
  cover_image: string | null;
};

const formatPrice = (value: number | null | undefined, currency: string | null | undefined, fallback: string, locale: string) => {
  if (value == null) return fallback;
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency: currency || "BRL" }).format(value);
  } catch {
    return `${value}`;
  }
};

export const ListingCard = ({ listing }: { listing: Listing }) => {
  const { t, i18n } = useTranslation();
  const { toggleFavorite, isFavorite } = useFavorites();
  const imgSrc = listing.cover_image || "/placeholder.svg";
  const locale = (i18n.language || "pt-BR");
  return (
    <Link to={`/anuncio/${listing.id}`} aria-label={`Ver anúncio ${listing.title}`}>
      <Card className="h-full overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-8px_hsl(var(--primary)/0.35)] hover:ring-1 hover:ring-primary/30 hover:border-primary/40">
        <div className="bg-muted relative">
          <AspectRatio ratio={16 / 9}>
            <LazyImage
              src={imgSrc}
              alt={`Imagem do anúncio: ${listing.title}`}
              className="h-full w-full"
              fallback="/placeholder.svg"
            />
          </AspectRatio>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 bg-background/80 hover:bg-background/90"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFavorite(listing.id);
            }}
          >
            <Heart 
              className={`w-4 h-4 ${isFavorite(listing.id) ? 'fill-primary text-primary' : 'text-muted-foreground'}`} 
            />
          </Button>
        </div>
        <CardHeader>
          <CardTitle className="line-clamp-1 text-xl">{listing.title}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <div className="font-medium text-foreground">{formatPrice(listing.price, listing.currency, t("price.combined"), locale)}</div>
          {listing.location && <div>{listing.location}</div>}
          <time dateTime={listing.created_at}>{new Date(listing.created_at).toLocaleDateString(locale)}</time>
        </CardContent>
      </Card>
    </Link>
  );
};
