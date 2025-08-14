
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { queryConfigs, createQueryKey } from "@/utils/query-config";
import { logger } from "@/utils/logger";

export const useCategories = () => {
  return useQuery({
    queryKey: createQueryKey("categories"),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("position", { ascending: true });
      
      if (error) {
        logger.error("Error fetching categories", { error: error.message });
        throw error;
      }
      
      return data;
    },
    ...queryConfigs.static
  });
};
