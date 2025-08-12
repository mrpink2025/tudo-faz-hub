import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type FeaturedListing = {
  id: string;
  title: string;
  price: number | null;
  currency: string | null;
  location: string | null;
  created_at: string;
  cover_image: string | null;
};

export const useFeaturedListings = (limit: number = 10) => {
  return useQuery({
    queryKey: ["featured-listings", limit],
    queryFn: async (): Promise<FeaturedListing[]> => {
      const { data, error } = await supabase
        .from("listings")
        .select("id,title,price,currency,location,created_at,cover_image")
        .eq("highlighted", true)
        .eq("approved", true)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1000 * 60, // 1 min
  });
};
