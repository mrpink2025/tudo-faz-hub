import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSalesReports } from "@/hooks/useSalesReports";
import { 
  DollarSign, 
  TrendingUp, 
  ShoppingCart, 
  Clock, 
  Calendar,
  Users,
  Download,
  Filter
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

export const SalesReportsPanel = () => {
  const { t } = useTranslation();
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [selectedSeller, setSelectedSeller] = useState<string>("");

  const { metrics, analytics, isLoading } = useSalesReports(
    startDate,
    endDate,
    selectedSeller || undefined
  );

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Processar dados para gráficos
  const dailyData = analytics.reduce((acc: any[], item) => {
    const date = item.sale_date;
    const existing = acc.find(d => d.date === date);
    
    if (existing) {
      existing.vendas += 1;
      existing.receita += item.amount / 100;
    } else {
      acc.push({
        date,
        vendas: 1,
        receita: item.amount / 100,
        formattedDate: formatDate(date)
      });
    }
    
    return acc;
  }, []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const hourlyData = Array.from({ length: 24 }, (_, hour) => {
    const sales = analytics.filter(item => item.sale_hour === hour).length;
    return {
      hour: `${hour.toString().padStart(2, '0')}:00`,
      vendas: sales
    };
  });

  if (isLoading) {
    return <div>{t("admin.sales.loading")}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t("admin.sales.title")}</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            {t("admin.sales.export")}
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {t("admin.sales.filters")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="start-date">{t("admin.sales.start_date")}</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="end-date">{t("admin.sales.end_date")}</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button className="w-full">
                {t("admin.sales.apply_filters")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("admin.sales.total_sales")}</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.total_sales || 0}</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.total_orders_today || 0} {t("admin.sales.sales_today")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("admin.sales.total_revenue")}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPrice(metrics?.total_revenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatPrice(metrics?.revenue_today || 0)} {t("admin.sales.revenue_today")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("admin.sales.avg_ticket")}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPrice(metrics?.avg_order_value || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("admin.sales.per_order")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("admin.sales.peak_hour")}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.peak_hour ? `${metrics.peak_hour}:00` : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("admin.sales.peak_hour_desc")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos e Tabelas */}
      <Tabs defaultValue="charts" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="charts">{t("admin.sales.charts")}</TabsTrigger>
          <TabsTrigger value="details">{t("admin.sales.details")}</TabsTrigger>
          <TabsTrigger value="analytics">{t("admin.sales.analytics")}</TabsTrigger>
        </TabsList>

        <TabsContent value="charts" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("admin.sales.sales_by_day")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="formattedDate" />
                    <YAxis />
                    <Tooltip />
                     <Line 
                      type="monotone" 
                      dataKey="vendas" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("admin.sales.sales_by_hour")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="vendas" fill="hsl(var(--secondary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.sales.sales_history")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.sales.date")}</TableHead>
                    <TableHead>{t("admin.sales.order")}</TableHead>
                    <TableHead>{t("admin.sales.buyer")}</TableHead>
                    <TableHead>{t("admin.sales.seller")}</TableHead>
                    <TableHead>{t("admin.sales.value")}</TableHead>
                    <TableHead>{t("admin.sales.status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.slice(0, 10).map((sale) => (
                    <TableRow key={sale.order_id}>
                      <TableCell>{formatDate(sale.created_at)}</TableCell>
                      <TableCell>#{sale.order_id.slice(0, 8)}</TableCell>
                      <TableCell>{sale.buyer_name || sale.buyer_email}</TableCell>
                      <TableCell>{sale.seller_name || sale.seller_email}</TableCell>
                      <TableCell>{formatPrice(sale.amount / 100)}</TableCell>
                      <TableCell>
                        <Badge variant={sale.status === 'delivered' ? 'default' : 'secondary'}>
                          {sale.status === 'pending' ? t("admin.sales.pending") :
                           sale.status === 'confirmed' ? t("admin.sales.confirmed") :
                           sale.status === 'shipped' ? t("admin.sales.shipped") :
                           sale.status === 'delivered' ? t("admin.sales.delivered") : t("admin.sales.cancelled")}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("admin.sales.best_day")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics?.top_selling_day || "N/A"}
                </div>
                <p className="text-muted-foreground">
                  {t("admin.sales.best_performance")}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("admin.sales.total_sellers")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Set(analytics.map(a => a.seller_id)).size}
                </div>
                <p className="text-muted-foreground">
                  {t("admin.sales.active_sellers")}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("admin.sales.affiliate_commissions")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatPrice(
                    analytics.reduce((sum, a) => sum + (a.affiliate_commission || 0), 0) / 100
                  )}
                </div>
                <p className="text-muted-foreground">
                  {t("admin.sales.total_commissions")}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};