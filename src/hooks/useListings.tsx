import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCategories } from "@/hooks/useCategories";

export type ListingsFilter = {
  categorySlug?: string;
};

export const useListings = (filters: ListingsFilter, passedCategories?: any[]) => {
  const { data: cats } = useCategories();
  const categories = passedCategories ?? cats ?? [];

  return useQuery({
    queryKey: ["listings", filters, categories?.length],
    queryFn: async () => {
      const { categorySlug } = filters || {};

      let categoryIds: string[] | undefined = undefined;
      if (categorySlug && categories.length) {
        const selected = categories.find((c: any) => c.slug === categorySlug);
        if (selected) {
          const root = selected.parent_id
            ? categories.find((c: any) => c.id === selected.parent_id)
            : selected;
          const children = categories.filter((c: any) => c.parent_id === root.id);
          categoryIds = [root.id, ...children.map((c: any) => c.id)];
        }
      }

      let query = supabase
        .from("listings")
        .select("id,title,price,currency,location,created_at,category_id")
        .eq("approved", true)
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (categoryIds && categoryIds.length) {
        query = query.in("category_id", categoryIds);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
};
