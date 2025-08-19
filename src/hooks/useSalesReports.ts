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
  // Primeiro tentar buscar via RPC functions
  const { data: metrics, isLoading: isLoadingMetrics, error: metricsError } = useQuery({
    queryKey: ["sales-summary", startDate, endDate, sellerId],
    queryFn: async (): Promise<SalesMetrics> => {
      try {
        const { data, error } = await supabase.rpc("get_sales_summary", {
          p_start_date: startDate || undefined,
          p_end_date: endDate || undefined,
          p_seller_id: sellerId || undefined,
        });

        if (error) throw error;
        return data?.[0] || {
          total_sales: 0,
          total_revenue: 0,
          avg_order_value: 0,
          top_selling_day: "",
          peak_hour: 0,
          total_orders_today: 0,
          revenue_today: 0,
        };
      } catch (error) {
        console.warn('RPC function get_sales_summary failed, falling back to direct query');
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1
  });

  const { data: analytics = [], isLoading: isLoadingAnalytics, error: analyticsError } = useQuery({
    queryKey: ["sales-analytics", startDate, endDate, sellerId],
    queryFn: async (): Promise<SalesAnalytics[]> => {
      try {
        const { data, error } = await supabase.rpc("get_sales_analytics", {
          p_start_date: startDate || undefined,
          p_end_date: endDate || undefined,
          p_seller_id: sellerId || undefined,
        });

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.warn('RPC function get_sales_analytics failed, falling back to direct query');
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1
  });

  // Fallback: buscar dados diretamente das tabelas se RPC falhar
  const { data: fallbackData, isLoading: isFallbackLoading } = useQuery({
    queryKey: ["sales-fallback", startDate, endDate, sellerId],
    queryFn: async () => {
      console.log('Using fallback direct query for sales data');
      
      let query = supabase
        .from('orders')
        .select(`
          *,
          profiles!orders_user_id_fkey(full_name, email),
          seller:profiles!orders_seller_id_fkey(full_name, email)
        `)
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false });

      if (startDate) {
        query = query.gte('created_at', `${startDate}T00:00:00.000Z`);
      }
      if (endDate) {
        query = query.lte('created_at', `${endDate}T23:59:59.999Z`);
      }
      if (sellerId) {
        query = query.eq('seller_id', sellerId);
      }

      const { data: orders, error } = await query.limit(1000);
      
      if (error) throw error;

      // Processar dados para o formato esperado
      const analytics: SalesAnalytics[] = (orders || []).map(order => ({
        order_id: order.id,
        created_at: order.created_at,
        amount: order.amount || 0,
        currency: order.currency || 'BRL',
        status: order.status,
        buyer_id: order.user_id,
        seller_id: order.seller_id || '',
        affiliate_id: order.affiliate_id,
        affiliate_commission: order.affiliate_commission || 0,
        buyer_email: (order.profiles as any)?.email || '',
        buyer_name: (order.profiles as any)?.full_name || '',
        seller_email: (order.seller as any)?.email || '',
        seller_name: (order.seller as any)?.full_name || '',
        total_items: Array.isArray(order.order_items) ? order.order_items.length : 1,
        sale_date: order.created_at.split('T')[0],
        sale_hour: new Date(order.created_at).getHours()
      }));

      // Calcular métricas
      const totalSales = analytics.length;
      const totalRevenue = analytics.reduce((sum, a) => sum + (a.amount / 100), 0);
      const avgOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;
      
      const today = new Date().toISOString().split('T')[0];
      const todayOrders = analytics.filter(a => a.sale_date === today);
      const totalOrdersToday = todayOrders.length;
      const revenueToday = todayOrders.reduce((sum, a) => sum + (a.amount / 100), 0);

      // Horário de pico
      const hourCounts = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        count: analytics.filter(a => a.sale_hour === hour).length
      }));
      const peakHour = hourCounts.reduce((max, curr) => curr.count > max.count ? curr : max, { hour: 0, count: 0 });

      // Melhor dia
      const dayGroups = analytics.reduce((acc: Record<string, number>, item) => {
        acc[item.sale_date] = (acc[item.sale_date] || 0) + 1;
        return acc;
      }, {});
      const topSellingDay = Object.entries(dayGroups).reduce(
        (max, [date, count]) => count > max.count ? { date, count } : max,
        { date: '', count: 0 }
      );

      const metrics: SalesMetrics = {
        total_sales: totalSales,
        total_revenue: totalRevenue,
        avg_order_value: avgOrderValue,
        top_selling_day: topSellingDay.date ? new Date(topSellingDay.date).toLocaleDateString('pt-BR') : '',
        peak_hour: peakHour.hour,
        total_orders_today: totalOrdersToday,
        revenue_today: revenueToday
      };

      return { metrics, analytics };
    },
    enabled: !!(metricsError || analyticsError), // Só executar se RPC falhar
    staleTime: 1000 * 60 * 5,
  });

  // Retornar dados do RPC se disponível, senão usar fallback
  return {
    metrics: metrics || fallbackData?.metrics,
    analytics: analytics.length > 0 ? analytics : (fallbackData?.analytics || []),
    isLoading: isLoadingMetrics || isLoadingAnalytics || isFallbackLoading,
    error: metricsError || analyticsError
  };
};