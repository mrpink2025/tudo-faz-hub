import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

export function useIsAdmin() {
  const { user } = useSupabaseAuth();

  const query = useQuery({
    enabled: !!user?.id,
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin");
      if (error) throw error;
      return (data?.length ?? 0) > 0;
    },
  });

  return { isAdmin: query.data ?? false, loading: query.isLoading };
}
