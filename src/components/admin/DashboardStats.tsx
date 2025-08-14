import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, ShoppingCart, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";

const fetchDashboardData = async () => {
  const [
    { data: totalUsers, error: usersError },
    { data: totalListings, error: listingsError },
    { data: totalOrders, error: ordersError },
    { data: monthlyStats, error: monthlyError }
  ] = await Promise.all([
    supabase.from("user_roles").select("user_id", { count: "exact", head: true }),
    supabase.from("listings").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase.from("listings").select("created_at").order("created_at", { ascending: false }).limit(100)
  ]);

  if (usersError) throw usersError;
  if (listingsError) throw listingsError;
  if (ordersError) throw ordersError;
  if (monthlyError) throw monthlyError;

  // Processar dados mensais
  const monthlyData = monthlyStats?.reduce((acc, listing) => {
    const month = new Date(listing.created_at).toLocaleDateString('pt-BR', { month: 'short' });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(monthlyData || {}).map(([month, count]) => ({
    month,
    listings: count
  }));

  return {
    users: totalUsers?.length || 0,
    listings: totalListings?.length || 0,
    orders: totalOrders?.length || 0,
    monthlyData: chartData
  };
};

export const DashboardStats = () => {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: fetchDashboardData
  });

  const pieData = [
    { name: t('admin.stats.users'), value: data?.users || 0, color: 'hsl(var(--primary))' },
    { name: t('admin.stats.listings'), value: data?.listings || 0, color: 'hsl(var(--brand-2))' },
    { name: t('admin.stats.orders'), value: data?.orders || 0, color: 'hsl(var(--brand-glow))' }
  ];

  return (
    <div className="space-y-6">
      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.stats.total_users')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "—" : data?.users}</div>
            <p className="text-xs text-muted-foreground">{t('admin.stats.registered_users')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.stats.total_listings')}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "—" : data?.listings}</div>
            <p className="text-xs text-muted-foreground">{t('admin.stats.published_listings')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.stats.total_orders')}</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "—" : data?.orders}</div>
            <p className="text-xs text-muted-foreground">{t('admin.stats.completed_orders')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.stats.growth_rate')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+12%</div>
            <p className="text-xs text-muted-foreground">{t('admin.stats.last_30_days')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Resumo de Dados */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.stats.listings_by_month')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.monthlyData && data.monthlyData.length > 0 ? (
                data.monthlyData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/20 rounded">
                    <span className="font-medium">{item.month}</span>
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-2 bg-primary rounded-full" 
                        style={{ width: `${Math.max(item.listings * 8, 20)}px` }}
                      />
                      <span className="font-semibold">{item.listings}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">{t('admin.stats.no_data')}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('admin.stats.general_distribution')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pieData.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded" style={{ backgroundColor: `${item.color}20` }}>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: item.color }}></div>
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <span className="font-semibold" style={{ color: item.color }}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};