import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { optimizeQuery, queryBatcher } from "@/utils/queryOptimization";
import { messageRateLimiter } from "@/utils/rateLimiter";

export function useOptimizedAffiliateAnalytics(affiliateId?: string) {
  const { toast } = useToast();

  // Optimized analytics with caching and batching
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["affiliate-analytics", affiliateId],
    queryFn: () => optimizeQuery(
      async () => {
        if (!affiliateId) return null;
        
        const { data, error } = await supabase.rpc("get_affiliate_analytics", {
          p_affiliate_id: affiliateId
        });
        
        if (error) throw error;
        return data;
      },
      { 
        ttl: 5 * 60 * 1000, // 5 minutes cache
        key: `analytics_${affiliateId}` 
      }
    ),
    enabled: !!affiliateId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return { analytics, isLoading };
}

export function useOptimizedAffiliateCommissions(affiliateId?: string) {
  // Batched commission queries for performance
  const { data: commissions, isLoading } = useQuery({
    queryKey: ["affiliate-commissions-optimized", affiliateId],
    queryFn: () => queryBatcher.add(
      `commissions_${affiliateId}`,
      async () => {
        if (!affiliateId) return [];
        
        // Optimized query with minimal fields
        const { data, error } = await supabase
          .from("affiliate_commissions")
          .select(`
            id, commission_amount, status, created_at,
            orders!inner(id, amount),
            listings!inner(id, title)
          `)
          .eq("affiliate_id", affiliateId)
          .order("created_at", { ascending: false })
          .limit(50); // Limit for performance
        
        if (error) throw error;
        return data;
      }
    ),
    enabled: !!affiliateId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  return { commissions, isLoading };
}

export function useOptimizedAffiliateLinks(affiliateId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Optimized links query with performance indexes
  const { data: links, isLoading } = useQuery({
    queryKey: ["affiliate-links-optimized", affiliateId],
    queryFn: () => optimizeQuery(
      async () => {
        if (!affiliateId) return [];
        
        const { data, error } = await supabase
          .from("affiliate_links")
          .select(`
            id, tracking_code, clicks_count, created_at,
            listings!inner(id, title, price, currency, cover_image)
          `)
          .eq("affiliate_id", affiliateId)
          .order("created_at", { ascending: false });
        
        if (error) throw error;
        return data;
      },
      { 
        ttl: 30 * 1000, // 30 seconds cache
        key: `links_${affiliateId}` 
      }
    ),
    enabled: !!affiliateId,
    staleTime: 30 * 1000,
  });

  // Rate-limited link creation
  const createLink = useMutation({
    mutationFn: async (listingId: string) => {
      // Check rate limit
      if (messageRateLimiter.isRateLimited(`create_link_${affiliateId}`)) {
        throw new Error("Rate limit exceeded. Please wait before creating more links.");
      }

      const { data, error } = await supabase
        .from("affiliate_links")
        .insert({
          affiliate_id: affiliateId,
          listing_id: listingId,
          tracking_code: await generateTrackingCode(),
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Link criado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["affiliate-links-optimized"] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao criar link", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  return { links, isLoading, createLink };
}

// Optimized affiliate listings with pagination
export function useOptimizedAffiliateListings(page: number = 0, limit: number = 20) {
  const { data, isLoading } = useQuery({
    queryKey: ["affiliate-listings-optimized", page, limit],
    queryFn: () => optimizeQuery(
      async () => {
        const offset = page * limit;
        
        const { data, error } = await supabase
          .from("listings")
          .select(`
            id, title, price, currency, cover_image,
            affiliate_enabled, affiliate_commission_rate
          `)
          .eq("affiliate_enabled", true)
          .eq("approved", true)
          .eq("status", "published")
          .range(offset, offset + limit - 1)
          .order("created_at", { ascending: false });
        
        if (error) throw error;
        return data;
      },
      { 
        ttl: 2 * 60 * 1000, // 2 minutes cache
        key: `listings_page_${page}_${limit}` 
      }
    ),
    staleTime: 2 * 60 * 1000,
  });

  return { listings: data, isLoading };
}

// Batch processing for affiliate withdrawals
export function useBatchAffiliateOperations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const processBatchPayouts = useMutation({
    mutationFn: async (batchSize: number = 100) => {
      const { data, error } = await supabase.rpc("process_affiliate_payouts", {
        p_batch_size: batchSize
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      toast({ 
        title: "Lote processado com sucesso!", 
        description: `${data?.processed_affiliates || 0} afiliados processados`
      });
      queryClient.invalidateQueries({ queryKey: ["affiliate"] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro no processamento", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  return { processBatchPayouts };
}

// Helper function for generating tracking codes
async function generateTrackingCode(): Promise<string> {
  const { data, error } = await supabase.rpc('generate_tracking_code');
  if (error) throw error;
  return data;
}

// Performance monitoring hook
export function useAffiliatePerformanceMonitor() {
  const { data: performance } = useQuery({
    queryKey: ["affiliate-performance"],
    queryFn: async () => {
      // Monitor key performance metrics
      const startTime = performance.now();
      
      const [clicks, conversions, commissions] = await Promise.all([
        supabase.from("affiliate_clicks").select("*", { count: "exact", head: true }),
        supabase.from("affiliate_clicks").select("*", { count: "exact", head: true }).eq("converted", true),
        supabase.from("affiliate_commissions").select("commission_amount").eq("status", "approved")
      ]);
      
      const endTime = performance.now();
      const queryTime = endTime - startTime;
      
      return {
        totalClicks: clicks.count || 0,
        totalConversions: conversions.count || 0,
        totalCommissions: commissions.data?.reduce((sum, c) => sum + c.commission_amount, 0) || 0,
        queryPerformance: `${queryTime.toFixed(2)}ms`,
        conversionRate: clicks.count ? ((conversions.count || 0) / clicks.count * 100).toFixed(2) : "0"
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 30000,
  });

  return { performance };
}