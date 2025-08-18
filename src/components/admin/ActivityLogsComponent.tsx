import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Activity, 
  DollarSign, 
  Mail, 
  User, 
  FileText, 
  TrendingUp,
  AlertCircle,
  CheckCircle
} from "lucide-react";

interface ActivityLog {
  id: string;
  user_id: string | null;
  activity_type: string;
  description: string;
  metadata: any;
  created_at: string;
}

export function ActivityLogsComponent() {
  const { t } = useTranslation();
  const [selectedType, setSelectedType] = useState<string>("all");

  // Buscar logs de atividade
  const { data: activityLogs, isLoading } = useQuery({
    queryKey: ['activity-logs', selectedType],
    queryFn: async () => {
      let query = supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (selectedType !== 'all') {
        query = query.eq('activity_type', selectedType);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as ActivityLog[];
    }
  });

  const getActivityIcon = (type: string) => {
    if (type.includes('email')) return <Mail className="h-4 w-4" />;
    if (type.includes('commission')) return <DollarSign className="h-4 w-4" />;
    if (type.includes('affiliate_request')) return <User className="h-4 w-4" />;
    if (type.includes('order')) return <FileText className="h-4 w-4" />;
    if (type.includes('withdrawal')) return <TrendingUp className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  const getActivityColor = (type: string) => {
    if (type.includes('error')) return 'text-destructive';
    if (type.includes('success') || type.includes('confirmed')) return 'text-primary';
    if (type.includes('email')) return 'text-secondary';
    if (type.includes('commission')) return 'text-accent';
    return 'text-muted-foreground';
  };

  const getBadgeVariant = (type: string) => {
    if (type.includes('error')) return 'destructive' as const;
    if (type.includes('success') || type.includes('confirmed')) return 'default' as const;
    return 'secondary' as const;
  };

  const formatActivityType = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'email_notification_affiliate_sale_confirmed': 'Email - Venda Confirmada',
      'email_notification_affiliate_request_new': 'Email - Nova Solicitação',
      'email_notification_order_status_change': 'Email - Status do Pedido',
      'email_notification_error': 'Erro no Email',
      'affiliate_commission_earned': 'Comissão Ganha',
      'affiliate_request_submitted': 'Solicitação Enviada',
      'affiliate_link_created': 'Link Criado',
      'withdrawal_requested': 'Saque Solicitado',
      'withdrawal_processed': 'Saque Processado',
      'order_status_updated': 'Status do Pedido Atualizado'
    };
    return typeMap[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  const uniqueTypes = [...new Set(activityLogs?.map(log => log.activity_type) || [])];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t("admin.activity.title")}</h2>
      </div>

      <Tabs value={selectedType} onValueChange={setSelectedType}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">{t("admin.activity.all")}</TabsTrigger>
          <TabsTrigger value="email_notification_affiliate_sale_confirmed">{t("admin.activity.sales")}</TabsTrigger>
          <TabsTrigger value="email_notification_affiliate_request_new">{t("admin.activity.requests")}</TabsTrigger>
          <TabsTrigger value="affiliate_commission_earned">{t("admin.activity.commissions")}</TabsTrigger>
          <TabsTrigger value="withdrawal_requested">{t("admin.activity.withdrawals")}</TabsTrigger>
          <TabsTrigger value="email_notification_error">{t("admin.activity.errors")}</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedType} className="space-y-4">
          <ScrollArea className="h-[600px]">
            <div className="space-y-3">
              {activityLogs?.map((log) => (
                <Card key={log.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`mt-1 ${getActivityColor(log.activity_type)}`}>
                          {getActivityIcon(log.activity_type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{formatActivityType(log.activity_type)}</h4>
                            <Badge variant={getBadgeVariant(log.activity_type)}>
                              {log.activity_type.includes('error') ? t("admin.activity.error_label") : 
                               log.activity_type.includes('success') ? t("admin.activity.success_label") : t("admin.activity.info_label")}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {log.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(log.created_at).toLocaleString('pt-BR')}
                          </p>
                          
                          {/* Mostrar metadata se existir */}
                          {log.metadata && Object.keys(log.metadata).length > 0 && (
                            <details className="mt-2">
                              <summary className="text-xs cursor-pointer text-blue-600 hover:text-blue-800">
                                {t("admin.activity.view_details")}
                              </summary>
                              <div className="mt-2 p-2 bg-muted rounded text-xs">
                                <pre className="whitespace-pre-wrap">
                                  {JSON.stringify(log.metadata, null, 2)}
                                </pre>
                              </div>
                            </details>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {(!activityLogs || activityLogs.length === 0) && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {t("admin.activity.no_activity")}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}