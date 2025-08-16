import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Hook for seller permissions
export function useSellerPermissions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sellerPermission, isLoading } = useQuery({
    queryKey: ["seller-permission"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seller_permissions")
        .select("*")
        .maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  const requestSellerAccess = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("seller_permissions")
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Solicitação de vendedor enviada para aprovação!" });
      queryClient.invalidateQueries({ queryKey: ["seller-permission"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao solicitar acesso",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    sellerPermission,
    isLoading,
    requestSellerAccess,
    canSell: sellerPermission?.approved || false,
  };
}

// Hook for shopping cart
export function useShoppingCart() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: cartItems, isLoading } = useQuery({
    queryKey: ["shopping-cart"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shopping_cart")
        .select(`
          *,
          listings!inner(
            id, title, price, currency, cover_image, user_id,
            profiles!listings_user_id_fkey(full_name)
          )
        `)
        .order("added_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addToCart = useMutation({
    mutationFn: async ({ listingId, quantity = 1 }: { listingId: string; quantity?: number }) => {
      // Check if can add to cart (same seller validation)
      const { data: canAdd, error: validationError } = await supabase
        .rpc("validate_cart_seller", {
          user_uuid: (await supabase.auth.getUser()).data.user?.id,
          new_listing_id: listingId,
        });

      if (validationError) throw validationError;
      if (!canAdd) {
        throw new Error("Só é possível adicionar produtos do mesmo vendedor ao carrinho");
      }

      const { data, error } = await supabase
        .from("shopping_cart")
        .upsert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          listing_id: listingId,
          quantity,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Produto adicionado ao carrinho!" });
      queryClient.invalidateQueries({ queryKey: ["shopping-cart"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao adicionar ao carrinho",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateQuantity = useMutation({
    mutationFn: async ({ cartId, quantity }: { cartId: string; quantity: number }) => {
      if (quantity <= 0) {
        const { error } = await supabase
          .from("shopping_cart")
          .delete()
          .eq("id", cartId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("shopping_cart")
          .update({ quantity })
          .eq("id", cartId)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping-cart"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar carrinho",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removeFromCart = useMutation({
    mutationFn: async (cartId: string) => {
      const { error } = await supabase
        .from("shopping_cart")
        .delete()
        .eq("id", cartId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Produto removido do carrinho!" });
      queryClient.invalidateQueries({ queryKey: ["shopping-cart"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover do carrinho",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const clearCart = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("shopping_cart")
        .delete()
        .match({ user_id: (await supabase.auth.getUser()).data.user?.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping-cart"] });
    },
  });

  const cartTotal = cartItems?.reduce((total, item) => {
    return total + (item.listings.price * item.quantity);
  }, 0) || 0;

  const cartCount = cartItems?.reduce((count, item) => count + item.quantity, 0) || 0;

  const sellerId = cartItems?.[0]?.listings?.user_id;

  return {
    cartItems,
    isLoading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    cartTotal,
    cartCount,
    sellerId,
  };
}

// Hook for product reviews
export function useProductReviews(listingId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["product-reviews", listingId],
    queryFn: async () => {
      if (!listingId) return [];
      const { data, error } = await supabase
        .from("product_reviews")
        .select(`
          *,
          profiles!product_reviews_user_id_fkey(full_name, avatar_url)
        `)
        .eq("listing_id", listingId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!listingId,
  });

  const { data: rating } = useQuery({
    queryKey: ["listing-rating", listingId],
    queryFn: async () => {
      if (!listingId) return null;
      const { data, error } = await supabase
        .rpc("get_listing_rating", { listing_uuid: listingId });
      if (error) throw error;
      return data;
    },
    enabled: !!listingId,
  });

  const addReview = useMutation({
    mutationFn: async ({
      listingId,
      orderId,
      rating,
      comment,
    }: {
      listingId: string;
      orderId: string;
      rating: number;
      comment?: string;
    }) => {
      const { data, error } = await supabase
        .from("product_reviews")
        .insert({
          listing_id: listingId,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          order_id: orderId,
          rating,
          comment,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Avaliação adicionada com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["product-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["listing-rating"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao adicionar avaliação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateReview = useMutation({
    mutationFn: async ({
      reviewId,
      rating,
      comment,
    }: {
      reviewId: string;
      rating: number;
      comment?: string;
    }) => {
      const { data, error } = await supabase
        .from("product_reviews")
        .update({ rating, comment })
        .eq("id", reviewId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Avaliação atualizada com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["product-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["listing-rating"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar avaliação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    reviews,
    rating,
    isLoading,
    addReview,
    updateReview,
  };
}

// Hook for order history
export function useOrderHistory() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ["order-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items(
            *,
            listings(id, title, cover_image, price, currency)
          )
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return {
    orders,
    isLoading,
  };
}

// Hook for seller order management
export function useSellerOrders() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ["seller-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          profiles!orders_user_id_fkey(full_name, email),
          order_items(
            *,
            listings(id, title, cover_image, price, currency)
          )
        `)
        .eq("seller_id", (await supabase.auth.getUser()).data.user?.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return {
    orders,
    isLoading,
  };
}