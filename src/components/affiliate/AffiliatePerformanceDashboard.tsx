import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Users, DollarSign, MousePointer, ShieldCheck } from "lucide-react";
import { useOptimizedAffiliateAnalytics, useAffiliatePerformanceMonitor } from "@/hooks/useOptimizedAffiliates";
import { useAffiliates } from "@/hooks/useAffiliates";

interface AnalyticsData {
  total_clicks: number;
  unique_clicks: number;
  conversions: number;
  total_earnings: number;
  conversion_rate: number;
  average_commission: number;
  period_start: string;
  period_end: string;
}

export function AffiliatePerformanceDashboard() {
  const { affiliateProfile } = useAffiliates();
  const { analytics, isLoading } = useOptimizedAffiliateAnalytics(affiliateProfile?.id);
  const { performance } = useAffiliatePerformanceMonitor();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Dados de performance não disponíveis
        </CardContent>
      </Card>
    );
  }

  const analyticsData = analytics as unknown as AnalyticsData;
  const conversionRate = analyticsData.conversion_rate || 0;
  const averageCommission = analyticsData.average_commission || 0;

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Cliques</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.total_clicks}</div>
            <div className="text-xs text-muted-foreground">
              {analyticsData.unique_clicks} únicos
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversões</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.conversions}</div>
            <div className="text-xs text-muted-foreground">
              {conversionRate}% taxa de conversão
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ganhos Totais</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {(analyticsData.total_earnings / 100).toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground">
              Média: R$ {(averageCommission / 100).toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Conversão</span>
                <span>{conversionRate}%</span>
              </div>
              <Progress value={conversionRate} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Métricas de Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Cliques Únicos vs Total</span>
              <div className="text-right">
                <div className="font-medium">
                  {analyticsData.unique_clicks} / {analyticsData.total_clicks}
                </div>
                <div className="text-xs text-muted-foreground">
                  {((analyticsData.unique_clicks / analyticsData.total_clicks) * 100).toFixed(1)}% únicos
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Taxa de Conversão</span>
              <Badge variant={conversionRate > 2 ? "default" : "secondary"}>
                {conversionRate}%
              </Badge>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Comissão Média</span>
              <div className="font-medium">
                R$ {(averageCommission / 100).toFixed(2)}
              </div>
            </div>

            {performance && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Tempo de Consulta</span>
                <Badge variant="outline">{performance.queryPerformance}</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Período de Análise</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <div>Início: {new Date(analyticsData.period_start).toLocaleDateString()}</div>
              <div>Fim: {new Date(analyticsData.period_end).toLocaleDateString()}</div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Status da Performance</div>
              {conversionRate > 3 ? (
                <Badge className="bg-green-100 text-green-800">Excelente</Badge>
              ) : conversionRate > 1.5 ? (
                <Badge className="bg-yellow-100 text-yellow-800">Boa</Badge>
              ) : (
                <Badge className="bg-red-100 text-red-800">Precisa Melhorar</Badge>
              )}
            </div>

            <div className="text-xs text-muted-foreground">
              Performance geral do sistema: {performance?.conversionRate}% de conversão
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}