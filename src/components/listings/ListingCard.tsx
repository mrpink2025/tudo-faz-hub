import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { LazyImage } from "@/components/ui/lazy-image";
import { useShoppingCart, useProductReviews } from "@/hooks/useEcommerce";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

type Listing = {
  id: string;
  title: string;
  price: number | null;
  currency: string | null;
  location: string | null;
  created_at: string;
  cover_image: string | null;
  sellable?: boolean;
  inventory_count?: number;
  sold_count?: number;
  user_id?: string;
};

const formatPrice = (value: number | null | undefined, currency: string | null | undefined, fallback: string, locale: string) => {
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

export const ListingCard = ({ listing }: { listing: Listing }) => {
  const { t, i18n } = useTranslation();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { user } = useSupabaseAuth();
  const { addToCart } = useShoppingCart();
  const { rating } = useProductReviews(listing.id);
  const { toast } = useToast();
  const imgSrc = listing.cover_image || "/placeholder.svg";
  const locale = (i18n.language || "pt-BR");

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Faça login para adicionar produtos ao carrinho",
        variant: "destructive",
      });
      return;
    }

    if (!listing.inventory_count || listing.inventory_count <= 0) {
      toast({
        title: "Produto indisponível",
        description: "Este produto está fora de estoque",
        variant: "destructive",
      });
      return;
    }

    addToCart.mutate({ listingId: listing.id });
  };

  const averageRating = (rating as any)?.average_rating || 0;
  const reviewCount = (rating as any)?.review_count || 0;
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
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <div className="font-medium text-foreground text-lg">
            {listing.price != null ? 
              formatPrice(listing.price / 100, listing.currency, t("price.combined"), locale) :
              t("price.combined")
            }
          </div>
          
          {listing.sellable && reviewCount > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${
                      i < Math.floor(averageRating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs">({reviewCount})</span>
            </div>
          )}

          {listing.location && <div>{listing.location}</div>}
          <time dateTime={listing.created_at}>{new Date(listing.created_at).toLocaleDateString(locale)}</time>
          
          {listing.sellable && (
            <div className="flex items-center justify-between pt-2">
              <div className="flex gap-2">
                <Badge variant="secondary" className="text-xs">
                  À Venda
                </Badge>
                {listing.inventory_count && listing.inventory_count > 0 && (
                  <Badge variant="outline" className="text-xs">
                    Estoque: {listing.inventory_count}
                  </Badge>
                )}
              </div>
              <Button
                size="sm"
                onClick={handleAddToCart}
                disabled={!listing.inventory_count || listing.inventory_count <= 0 || addToCart.isPending}
                className="h-8"
              >
                <ShoppingCart className="h-3 w-3 mr-1" />
                {addToCart.isPending ? "..." : "Comprar"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};
