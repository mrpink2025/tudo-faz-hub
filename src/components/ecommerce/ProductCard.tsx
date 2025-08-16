import { useState } from "react";
import { Star, ShoppingCart, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useShoppingCart } from "@/hooks/useEcommerce";
import { useProductReviews } from "@/hooks/useEcommerce";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface ProductCardProps {
  listing: {
    id: string;
    title: string;
    price: number;
    currency: string;
    cover_image: string | null;
    sellable: boolean;
    inventory_count: number;
    sold_count: number;
    user_id: string;
  };
}

export function ProductCard({ listing }: ProductCardProps) {
  const [imageLoading, setImageLoading] = useState(true);
  const { user } = useSupabaseAuth();
  const { addToCart } = useShoppingCart();
  const { rating } = useProductReviews(listing.id);
  const { toast } = useToast();

  const handleAddToCart = async () => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Faça login para adicionar produtos ao carrinho",
        variant: "destructive",
      });
      return;
    }

    if (listing.inventory_count <= 0) {
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
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300">
      <div className="relative aspect-square overflow-hidden bg-muted">
        {listing.cover_image ? (
          <img
            src={listing.cover_image}
            alt={listing.title}
            className={`object-cover w-full h-full group-hover:scale-105 transition-transform duration-300 ${
              imageLoading ? "opacity-0" : "opacity-100"
            }`}
            onLoad={() => setImageLoading(false)}
            loading="lazy"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <Eye className="h-12 w-12" />
          </div>
        )}

        {listing.sellable && (
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              À Venda
            </Badge>
          </div>
        )}

        {listing.inventory_count <= 0 && listing.sellable && (
          <div className="absolute top-2 right-2">
            <Badge variant="destructive">Esgotado</Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <Link to={`/anuncio/${listing.id}`} className="block group">
          <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
            {listing.title}
          </h3>
        </Link>

        <div className="flex items-center gap-2 mt-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < Math.floor(averageRating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground"
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-muted-foreground">
            ({reviewCount})
          </span>
        </div>

        <div className="mt-2">
          <span className="text-2xl font-bold text-primary">
            R$ {(listing.price / 100).toFixed(2)}
          </span>
        </div>

        {listing.sellable && (
          <div className="mt-2 text-sm text-muted-foreground">
            <div>Estoque: {listing.inventory_count}</div>
            <div>Vendidos: {listing.sold_count}</div>
          </div>
        )}
      </CardContent>

      {listing.sellable && (
        <CardFooter className="p-4 pt-0">
          <Button
            onClick={handleAddToCart}
            disabled={listing.inventory_count <= 0 || addToCart.isPending}
            className="w-full"
            variant={listing.inventory_count <= 0 ? "secondary" : "default"}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {listing.inventory_count <= 0
              ? "Indisponível"
              : addToCart.isPending
              ? "Adicionando..."
              : "Adicionar ao Carrinho"}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}