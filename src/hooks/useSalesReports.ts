import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SalesMetrics = {
  total_sales: number;
  total_revenue: number;
  avg_order_value: number;
  top_selling_day: string;
  peak_hour: number;
  total_orders_today: number;
  revenue_today: number;
};

export type SalesAnalytics = {
  order_id: string;
  created_at: string;
  amount: number;
  currency: string;
  status: string;
  buyer_id: string;
  seller_id: string;
  affiliate_id: string | null;
  affiliate_commission: number;
  buyer_email: string;
  buyer_name: string;
  seller_email: string;
  seller_name: string;
  total_items: number;
  sale_date: string;
  sale_hour: number;
};

export const useSalesReports = (
  startDate?: string,
  endDate?: string,
  sellerId?: string
) => {
  const { data: metrics, isLoading: isLoadingMetrics } = useQuery({
    queryKey: ["sales-summary", startDate, endDate, sellerId],
    queryFn: async (): Promise<SalesMetrics> => {
      const { data, error } = await supabase.rpc("get_sales_summary", {
        p_start_date: startDate || undefined,
        p_end_date: endDate || undefined,
        p_seller_id: sellerId || undefined,
      });

      if (error) throw error;
      return data[0] || {
        total_sales: 0,
        total_revenue: 0,
        avg_order_value: 0,
        top_selling_day: "",
        peak_hour: 0,
        total_orders_today: 0,
        revenue_today: 0,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { data: analytics = [], isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ["sales-analytics", startDate, endDate, sellerId],
    queryFn: async (): Promise<SalesAnalytics[]> => {
      const { data, error } = await supabase.rpc("get_sales_analytics", {
        p_start_date: startDate || undefined,
        p_end_date: endDate || undefined,
        p_seller_id: sellerId || undefined,
      });

      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    metrics,
    analytics,
    isLoading: isLoadingMetrics || isLoadingAnalytics,
  };
};