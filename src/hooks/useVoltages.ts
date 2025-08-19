import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Voltage {
  id: string;
  name: string;
  sort_order: number;
}

export interface ListingVoltage {
  id: string;
  listing_id: string;
  voltage_id: string;
  stock_quantity: number;
  voltage: Voltage;
}

export function useVoltages() {
  return useQuery({
    queryKey: ["voltages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("voltages")
        .select("*")
        .order("sort_order");

      if (error) throw error;
      return data as Voltage[];
    },
  });
}

export function useListingVoltages(listingId: string) {
  return useQuery({
    queryKey: ["listing-voltages", listingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listing_voltages")
        .select(`
          id,
          listing_id,
          voltage_id,
          stock_quantity,
          voltages!inner(id, name, sort_order)
        `)
        .eq("listing_id", listingId);

      if (error) throw error;
      return (data as any)?.map((item: any) => ({
        ...item,
        voltage: item.voltages
      })) as ListingVoltage[];
    },
    enabled: !!listingId,
  });
}

export function useUpdateListingVoltages() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      listingId, 
      voltages 
    }: { 
      listingId: string; 
      voltages: { voltageId: string; stockQuantity: number }[] 
    }) => {
      // First, delete existing voltages for this listing
      const { error: deleteError } = await supabase
        .from("listing_voltages")
        .delete()
        .eq("listing_id", listingId);

      if (deleteError) throw deleteError;

      // Then insert new voltages
      if (voltages.length > 0) {
        const { error: insertError } = await supabase
          .from("listing_voltages")
          .insert(
            voltages.map(voltage => ({
              listing_id: listingId,
              voltage_id: voltage.voltageId,
              stock_quantity: voltage.stockQuantity,
            }))
          );

        if (insertError) throw insertError;
      }
    },
    onSuccess: (_, { listingId }) => {
      toast({
        title: "Voltagens atualizadas com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["listing-voltages", listingId] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar voltagens",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}