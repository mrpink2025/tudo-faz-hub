import { useState } from "react";
import { ShoppingCart, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useShoppingCart } from "@/hooks/useEcommerce";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useNavigate } from "react-router-dom";

interface BuyNowButtonProps {
  listing: {
    id: string;
    title: string;
    price: number;
    user_id: string;
    currency?: string;
  };
}

export function BuyNowButton({ listing }: BuyNowButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { addToCart } = useShoppingCart();
  const { toast } = useToast();
  const { user } = useSupabaseAuth();
  const navigate = useNavigate();

  const handleBuyNow = async () => {
    if (!user) {
      toast({
        title: "Faça login",
        description: "Você precisa estar logado para comprar",
        variant: "destructive",
      });
      return;
    }

    // Redirecionar para página de checkout interna
    navigate(`/checkout?listing=${listing.id}&quantity=1`);
  };

  const handleAddToCart = () => {
    if (!user) {
      toast({
        title: "Faça login",
        description: "Você precisa estar logado para adicionar ao carrinho",
        variant: "destructive",
      });
      return;
    }

    addToCart.mutate({
      listingId: listing.id,
      quantity: 1,
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
        {isLoading ? "Processando..." : "Comprar Agora"}
      </Button>
      
      <Button
        onClick={handleAddToCart}
        variant="outline"
        disabled={isLoading || addToCart.isPending}
        className="w-full"
        size="lg"
      >
        <ShoppingCart className="mr-2 h-4 w-4" />
        {addToCart.isPending ? "Adicionando..." : "Adicionar ao Carrinho"}
      </Button>
    </div>
  );
}