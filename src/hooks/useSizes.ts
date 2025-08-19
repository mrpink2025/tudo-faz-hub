import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Size {
  id: string;
  name: string;
  category: string;
  sort_order: number;
}

export interface ListingSize {
  id: string;
  listing_id: string;
  size_id: string;
  stock_quantity: number;
  size: Size;
}

export function useSizes(category?: string) {
  return useQuery({
    queryKey: ["sizes", category],
    queryFn: async () => {
      let query = supabase
        .from("sizes")
        .select("*")
        .order("sort_order");

      if (category) {
        query = query.eq("category", category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Size[];
    },
  });
}

export function useListingSizes(listingId: string) {
  return useQuery({
    queryKey: ["listing-sizes", listingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listing_sizes")
        .select(`
          *,
          size:sizes(*)
        `)
        .eq("listing_id", listingId);

      if (error) throw error;
      return data as ListingSize[];
    },
    enabled: !!listingId,
  });
}

export function useUpdateListingSizes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      listingId, 
      sizes 
    }: { 
      listingId: string; 
      sizes: { sizeId: string; stockQuantity: number }[] 
    }) => {
      // First, delete existing sizes for this listing
      const { error: deleteError } = await supabase
        .from("listing_sizes")
        .delete()
        .eq("listing_id", listingId);

      if (deleteError) throw deleteError;

      // Then insert new sizes
      if (sizes.length > 0) {
        const { error: insertError } = await supabase
          .from("listing_sizes")
          .insert(
            sizes.map(size => ({
              listing_id: listingId,
              size_id: size.sizeId,
              stock_quantity: size.stockQuantity,
            }))
          );

        if (insertError) throw insertError;
      }
    },
    onSuccess: (_, { listingId }) => {
      toast({
        title: "Tamanhos atualizados com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["listing-sizes", listingId] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar tamanhos",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}