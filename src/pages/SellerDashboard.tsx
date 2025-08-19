import { useTranslation } from "react-i18next";
import { SellerOrdersPanel } from "@/components/seller/SellerOrdersPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSellerOrders } from "@/hooks/useEcommerce";
import { Package, DollarSign, TrendingUp, Clock } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";

export default function SellerDashboard() {
  const { t } = useTranslation();
  const { orders = [] } = useSellerOrders();

  // Calcular estatísticas
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(order => order.status === "pending").length;
  const totalRevenue = orders
    .filter(order => order.status !== "cancelled")
    .reduce((sum, order) => sum + (order.amount || 0), 0);
  const completedOrders = orders.filter(order => order.status === "delivered").length;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price / 100);
  };

  return (
    <>
      <SEOHead 
        title={t("seller.dashboard") + " - " + t("seller.manage_orders")}
        description={t("seller.manage_orders")}
      />
      
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">{t("seller.dashboard")}</h1>
          <Badge variant="outline">{t("seller.dashboard")}</Badge>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("seller.total_orders")}</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrders}</div>
              <p className="text-xs text-muted-foreground">
                {pendingOrders} {t("seller.pending").toLowerCase()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("seller.revenue_total")}</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPrice(totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                {t("seller.confirmed").toLowerCase()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("seller.completed_orders")}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedOrders}</div>
              <p className="text-xs text-muted-foreground">
                {totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0}% {t("seller.completion_rate")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("seller.pending")}</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingOrders}</div>
              <p className="text-xs text-muted-foreground">
                {t("seller.requires_attention")}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Painel de Pedidos */}
        <SellerOrdersPanel />
      </div>
    </>
  );
}