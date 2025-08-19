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
import { BuyNowButton } from "./BuyNowButton";
import { useTranslation } from "react-i18next";
import { ProductSizeSelector } from "./ProductSizeSelector";
import ContactSellerButton from "@/components/chat/ContactSellerButton";

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
    size_required?: boolean;
  };
}

export function ProductCard({ listing }: ProductCardProps) {
  const [imageLoading, setImageLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string | undefined>();
  const { user } = useSupabaseAuth();
  const { addToCart } = useShoppingCart();
  const { rating } = useProductReviews(listing.id);
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleAddToCart = async () => {
    if (!user) {
      toast({
        title: t("auth.login_required"),
        description: t("auth.login_required_desc"),
        variant: "destructive",
      });
      return;
    }

    if (listing.size_required && !selectedSize) {
      toast({
        title: "Selecione um tamanho",
        description: "Este produto requer que você selecione um tamanho antes de adicionar ao carrinho.",
        variant: "destructive",
      });
      return;
    }

    if (listing.inventory_count <= 0) {
      toast({
        title: t("auth.product_unavailable"),
        description: t("auth.out_of_stock"),
        variant: "destructive",
      });
      return;
    }

    addToCart.mutate({ listingId: listing.id, sizeId: selectedSize });
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
              {t("product.for_sale")}
            </Badge>
          </div>
        )}

        {listing.inventory_count <= 0 && listing.sellable && (
          <div className="absolute top-2 right-2">
            <Badge variant="destructive">{t("product.sold_out")}</Badge>
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
            ({reviewCount} {t("product.reviews")})
          </span>
        </div>

        <div className="mt-2">
          <span className="text-2xl font-bold text-primary">
            {new Intl.NumberFormat('pt-BR', { 
              style: "currency", 
              currency: "BRL",
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            }).format(listing.price / 100)}
          </span>
        </div>

        {listing.sellable && (
          <div className="mt-2 text-sm text-muted-foreground">
            <div>{t("product.stock")}: {listing.inventory_count}</div>
            <div>{t("product.sold")}: {listing.sold_count}</div>
          </div>
        )}

        {/* Size selector for products that require size */}
        {listing.size_required && (
          <ProductSizeSelector
            listingId={listing.id}
            selectedSize={selectedSize}
            onSizeChange={setSelectedSize}
            className="mt-4"
          />
        )}
      </CardContent>

      {listing.sellable && (
        <CardFooter className="p-4 pt-0">
          {listing.inventory_count > 0 ? (
            <BuyNowButton listing={listing} selectedSize={selectedSize} />
          ) : (
            <Button disabled className="w-full" variant="secondary">
              <ShoppingCart className="h-4 w-4 mr-2" />
              {t("product.unavailable")}
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}