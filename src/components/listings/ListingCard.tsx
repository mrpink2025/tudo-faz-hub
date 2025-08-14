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
      <Card className="h-full overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:ring-1 hover:ring-primary/20 hover:border-primary/30 bg-card/80 backdrop-blur-sm">
        <div className="bg-muted relative group">
          <AspectRatio ratio={4 / 3}>
            <LazyImage
              src={imgSrc}
              alt={`Imagem do anúncio: ${listing.title}`}
              className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
              fallback="/placeholder.svg"
            />
          </AspectRatio>
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 h-9 w-9 bg-white/90 hover:bg-white shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-110"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFavorite(listing.id);
            }}
          >
            <Heart 
              className={`w-4 h-4 transition-colors ${isFavorite(listing.id) ? 'fill-red-500 text-red-500' : 'text-gray-600 hover:text-red-400'}`} 
            />
          </Button>
        </div>
        <CardContent className="p-4 sm:p-5 flex-1 flex flex-col">
          <div className="flex-1 space-y-2">
            <h3 className="font-semibold text-sm sm:text-base leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {listing.title}
            </h3>
            <div className="text-lg sm:text-xl font-bold text-primary">
              {formatPrice(listing.price, listing.currency, t("price.combined"), locale)}
            </div>
            {listing.location && (
              <p className="text-xs text-muted-foreground truncate">
                {listing.location}
              </p>
            )}
          </div>
          <div className="pt-3 mt-3 border-t border-border/50">
            <time className="text-xs text-muted-foreground" dateTime={listing.created_at}>
              {new Date(listing.created_at).toLocaleDateString(locale)}
            </time>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
