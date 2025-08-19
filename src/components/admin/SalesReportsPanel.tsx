import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSalesReports, SalesAnalytics } from "@/hooks/useSalesReports";
import { SaleDetailModal } from "./SaleDetailModal";
import { 
  DollarSign, 
  TrendingUp, 
  ShoppingCart, 
  Clock, 
  Calendar,
  Users,
  Download,
  Filter,
  Eye
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
  const [selectedSale, setSelectedSale] = useState<SalesAnalytics | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const { metrics, analytics, isLoading, error } = useSalesReports(
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

  const openSaleDetail = (sale: SalesAnalytics) => {
    setSelectedSale(sale);
    setIsDetailModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>{t("admin.sales.loading")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive mb-4">Erro ao carregar dados de vendas</p>
          <Button onClick={() => window.location.reload()}>
            Tentar novamente
          </Button>
        </div>
      </div>
    );
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
              <div className="text-sm text-muted-foreground">
                {analytics.length > 0 ? `${analytics.length} transações encontradas` : 'Nenhuma transação encontrada'}
              </div>
            </CardHeader>
            <CardContent>
              {analytics.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Nenhuma venda encontrada no período selecionado</p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStartDate(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
                      setEndDate(new Date().toISOString().split('T')[0]);
                    }}
                  >
                    Expandir para últimos 90 dias
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("admin.sales.date")}</TableHead>
                      <TableHead>{t("admin.sales.order")}</TableHead>
                      <TableHead>{t("admin.sales.buyer")}</TableHead>
                      <TableHead>{t("admin.sales.seller")}</TableHead>
                      <TableHead>{t("admin.sales.value")}</TableHead>
                      <TableHead>{t("admin.sales.status")}</TableHead>
                      <TableHead>Detalhes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.slice(0, 50).map((sale) => (
                      <TableRow key={sale.order_id}>
                        <TableCell className="font-mono text-xs">
                          {formatDate(sale.created_at)}
                          <br />
                          <span className="text-muted-foreground">
                            {new Date(sale.created_at).toLocaleTimeString('pt-BR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono">
                          <div className="flex flex-col">
                            <span className="font-semibold">#{sale.order_id.slice(0, 8)}</span>
                            <span className="text-xs text-muted-foreground">
                              {sale.total_items} {sale.total_items === 1 ? 'item' : 'itens'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{sale.buyer_name || 'N/A'}</span>
                            <span className="text-xs text-muted-foreground">{sale.buyer_email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{sale.seller_name || 'N/A'}</span>
                            <span className="text-xs text-muted-foreground">{sale.seller_email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold">{formatPrice(sale.amount / 100)}</span>
                            {sale.affiliate_commission > 0 && (
                              <span className="text-xs text-orange-600">
                                Comissão: {formatPrice(sale.affiliate_commission / 100)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            sale.status === 'delivered' ? 'default' : 
                            sale.status === 'confirmed' ? 'secondary' :
                            sale.status === 'shipped' ? 'outline' : 'destructive'
                          }>
                            {sale.status === 'pending' ? t("admin.sales.pending") :
                             sale.status === 'confirmed' ? t("admin.sales.confirmed") :
                             sale.status === 'shipped' ? t("admin.sales.shipped") :
                             sale.status === 'delivered' ? t("admin.sales.delivered") : 
                             sale.status === 'cancelled' ? t("admin.sales.cancelled") : sale.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openSaleDetail(sale)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
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

      <SaleDetailModal
        sale={selectedSale}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
      />
    </div>
  );
};