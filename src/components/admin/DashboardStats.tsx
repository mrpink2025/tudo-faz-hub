import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Users, FileText, ShoppingCart, TrendingUp } from "lucide-react";

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
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: fetchDashboardData
  });

  const pieData = [
    { name: 'Usuários', value: data?.users || 0, color: 'hsl(var(--primary))' },
    { name: 'Anúncios', value: data?.listings || 0, color: 'hsl(var(--brand-2))' },
    { name: 'Pedidos', value: data?.orders || 0, color: 'hsl(var(--brand-glow))' }
  ];

  return (
    <div className="space-y-6">
      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "—" : data?.users}</div>
            <p className="text-xs text-muted-foreground">Usuários registrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Anúncios</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "—" : data?.listings}</div>
            <p className="text-xs text-muted-foreground">Anúncios publicados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "—" : data?.orders}</div>
            <p className="text-xs text-muted-foreground">Pedidos realizados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Crescimento</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+12%</div>
            <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-full overflow-hidden">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Anúncios por Mês</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="w-full h-[300px] overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.monthlyData || []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="listings" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Distribuição Geral</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="w-full h-[300px] overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};