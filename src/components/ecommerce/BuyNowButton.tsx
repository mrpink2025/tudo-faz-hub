import { useState } from "react";
import { ShoppingCart, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useShoppingCart } from "@/hooks/useEcommerce";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { TranslatedText } from "@/components/ui/translated-text";
import ContactSellerButton from "@/components/chat/ContactSellerButton";

interface BuyNowButtonProps {
  listing: {
    id: string;
    title: string;
    price: number;
    user_id: string;
    currency?: string;
    size_required?: boolean;
  };
  selectedSize?: string;
}

export function BuyNowButton({ listing, selectedSize }: BuyNowButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { addToCart, clearCart } = useShoppingCart();
  const { toast } = useToast();
  const { user } = useSupabaseAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleBuyNow = async () => {
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
        title: t("product.select_size"),
        description: t("product.select_size_buy_desc"),
        variant: "destructive",
      });
      return;
    }

    // Ir direto para checkout com apenas este item
    try {
      setIsLoading(true);
      
      // Criar checkout direto com este item
      const { data, error } = await supabase.functions.invoke('create-product-checkout', {
        body: {
          items: [{
            listing_id: listing.id,
            title: listing.title,
            price: listing.price,
            quantity: 1,
            size_id: selectedSize,
          }],
          seller_id: listing.user_id
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('URL de checkout não recebida');
      }
    } catch (error: any) {
      toast({
        title: t("errors.purchase_error"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!user) {
      toast({
        title: t("auth.login_required"),
        description: t("auth.login_required_cart"),
        variant: "destructive",
      });
      return;
    }

    if (listing.size_required && !selectedSize) {
      toast({
        title: t("product.select_size"),
        description: t("product.select_size_desc"),
        variant: "destructive",
      });
      return;
    }

    addToCart.mutate({
      listingId: listing.id,
      quantity: 1,
      sizeId: selectedSize,
    });
  };

  return (
    <div className="space-y-3">
      <Button
        onClick={handleBuyNow}
        disabled={isLoading || addToCart.isPending}
        className="w-full"
        size="lg"
      >
        <CreditCard className="mr-2 h-4 w-4" />
        <TranslatedText text={isLoading ? t("ui.processing") : t("product.buy_now")} domain="ui" />
      </Button>
      
      <ContactSellerButton 
        sellerId={listing.user_id}
        sellerName="Vendedor"
        listingTitle={listing.title}
        variant="outline"
        size="lg"
        className="w-full"
      />
      
      <Button
        onClick={handleAddToCart}
        variant="outline"
        disabled={isLoading || addToCart.isPending}
        className="w-full"
        size="lg"
      >
        <ShoppingCart className="mr-2 h-4 w-4" />
        <TranslatedText text={addToCart.isPending ? t("ui.adding") : t("product.add_to_cart")} domain="ui" />
      </Button>
    </div>
  );
}