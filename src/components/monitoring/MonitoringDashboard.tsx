import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HealthCheckWidget } from '@/components/monitoring/HealthCheckWidget';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { RefreshCw, TrendingUp, Users, Eye, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AnalyticsData {
  pageViews: Array<{ date: string; views: number }>;
  topPages: Array<{ page: string; views: number }>;
  userActions: Array<{ action: string; count: number }>;
  performanceMetrics: Array<{ metric: string; value: number; unit: string }>;
  conversionMetrics: Array<{ type: string; value: number; percentage: number }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const MonitoringDashboard = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    pageViews: [],
    topPages: [],
    userActions: [],
    performanceMetrics: [],
    conversionMetrics: []
  });
  const [loading, setLoading] = useState(true);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Load page views over time
      const { data: pageViewsData } = await supabase
        .from('telemetry_events')
        .select('timestamp')
        .eq('event_type', 'page_view')
        .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('timestamp', { ascending: true });

      // Process page views by day
      const pageViewsByDay = pageViewsData?.reduce((acc: Record<string, number>, event) => {
        const date = new Date(event.timestamp).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {}) || {};

      const pageViews = Object.entries(pageViewsByDay).map(([date, views]) => ({
        date,
        views: views as number
      }));

      // Load top pages
      const { data: topPagesData } = await supabase
        .from('telemetry_events')
        .select('event_data')
        .eq('event_type', 'page_view')
        .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      const topPagesCount = topPagesData?.reduce((acc: Record<string, number>, event) => {
        const page = (event.event_data as any)?.page || 'unknown';
        acc[page] = (acc[page] || 0) + 1;
        return acc;
      }, {}) || {};

      const topPages = Object.entries(topPagesCount)
        .map(([page, views]) => ({ page, views: views as number }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 5);

      // Load user actions
      const { data: userActionsData } = await supabase
        .from('telemetry_events')
        .select('event_data')
        .eq('event_type', 'user_action')
        .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      const userActionsCount = userActionsData?.reduce((acc: Record<string, number>, event) => {
        const action = (event.event_data as any)?.action || 'unknown';
        acc[action] = (acc[action] || 0) + 1;
        return acc;
      }, {}) || {};

      const userActions = Object.entries(userActionsCount)
        .map(([action, count]) => ({ action, count: count as number }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Load performance metrics
      const { data: performanceData } = await supabase
        .from('performance_metrics')
        .select('metric_type, value')
        .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const avgMetrics = performanceData?.reduce((acc: Record<string, { sum: number; count: number }>, metric) => {
        if (!acc[metric.metric_type]) {
          acc[metric.metric_type] = { sum: 0, count: 0 };
        }
        acc[metric.metric_type].sum += parseFloat(metric.value.toString());
        acc[metric.metric_type].count += 1;
        return acc;
      }, {}) || {};

      const performanceMetrics = Object.entries(avgMetrics).map(([metric, data]) => ({
        metric,
        value: Math.round(data.sum / data.count),
        unit: metric.includes('time') ? 'ms' : metric.includes('lcp') ? 'ms' : 'count'
      }));

      setAnalytics({
        pageViews,
        topPages,
        userActions,
        performanceMetrics,
        conversionMetrics: [
          { type: 'Visualizações', value: pageViews.reduce((sum, day) => sum + day.views, 0), percentage: 100 },
          { type: 'Engajamento', value: userActions.reduce((sum, action) => sum + action.count, 0), percentage: 75 },
          { type: 'Conversões', value: 45, percentage: 15 }
        ]
      });

    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard de Monitoramento</h1>
          <p className="text-muted-foreground">
            Visão geral da performance e uso da aplicação
          </p>
        </div>
        <Button onClick={loadAnalytics} disabled={loading} variant="outline">
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* System Health */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <HealthCheckWidget showDetails className="md:col-span-2" />
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visualizações (7d)</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.pageViews.reduce((sum, day) => sum + day.views, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              +12% desde a semana passada
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ações do Usuário</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.userActions.reduce((sum, action) => sum + action.count, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              +8% desde a semana passada
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Visualizações por Dia</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.pageViews}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="views" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Páginas Mais Visitadas</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.topPages}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="page" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="views" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ações Mais Frequentes</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.userActions.slice(0, 5)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ action, percent }) => `${action} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analytics.userActions.slice(0, 5).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Métricas de Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.performanceMetrics.map((metric, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="text-sm font-medium">{metric.metric}</div>
                  <div className="text-sm text-muted-foreground">
                    {metric.value}{metric.unit}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};