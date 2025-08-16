import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Shield, Eye } from "lucide-react";
import { useIsAdmin } from "@/hooks/useIsAdmin";

interface FraudAlert {
  id: string;
  affiliate_link_id: string;
  visitor_ip: string;
  fraud_score: number;
  is_suspicious: boolean;
  is_fraudulent: boolean;
  reasons: string[];
  clicked_at: string;
  listing_title?: string;
  affiliate_code?: string;
}

interface FraudDetectionResult {
  fraud_score: number;
  is_suspicious: boolean;
  is_fraudulent: boolean;
  reasons: string[];
}

export function FraudDetectionMonitor() {
  const { isAdmin } = useIsAdmin();

  const { data: fraudAlerts, isLoading } = useQuery({
    queryKey: ["fraud-alerts"],
    queryFn: async () => {
      if (!isAdmin) return [];

      const { data, error } = await supabase
        .from("affiliate_clicks")
        .select(`
          id, affiliate_link_id, visitor_ip, clicked_at,
          affiliate_links!inner(
            tracking_code,
            listings!inner(title),
            affiliates!inner(affiliate_code)
          )
        `)
        .gte("clicked_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order("clicked_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      // Simulate fraud detection results (in real implementation, this would come from the database)
      const alertsWithFraud = await Promise.all(
        (data || []).map(async (click) => {
          // Call fraud detection for each click
          const { data: fraudData } = await supabase.rpc("detect_affiliate_fraud", {
            p_affiliate_link_id: click.affiliate_link_id,
            p_visitor_ip: click.visitor_ip,
            p_user_agent: null
          });

          const fraudResult = fraudData as unknown as FraudDetectionResult;

          return {
            ...click,
            fraud_score: fraudResult?.fraud_score || 0,
            is_suspicious: fraudResult?.is_suspicious || false,
            is_fraudulent: fraudResult?.is_fraudulent || false,
            reasons: fraudResult?.reasons || [],
            listing_title: (click.affiliate_links as any)?.listings?.title,
            affiliate_code: (click.affiliate_links as any)?.affiliates?.affiliate_code
          };
        })
      );

      return alertsWithFraud.filter(alert => alert.is_suspicious || alert.is_fraudulent);
    },
    enabled: isAdmin,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (!isAdmin) {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Monitoramento de Fraude
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Carregando...</div>
        </CardContent>
      </Card>
    );
  }

  const highRiskAlerts = fraudAlerts?.filter(alert => alert.is_fraudulent) || [];
  const suspiciousAlerts = fraudAlerts?.filter(alert => alert.is_suspicious && !alert.is_fraudulent) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Monitoramento de Fraude
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-destructive">{highRiskAlerts.length}</div>
            <div className="text-sm text-muted-foreground">Alto Risco</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-warning">{suspiciousAlerts.length}</div>
            <div className="text-sm text-muted-foreground">Suspeitos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-muted-foreground">{fraudAlerts?.length || 0}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </div>
        </div>

        {fraudAlerts && fraudAlerts.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Alertas Recentes
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {fraudAlerts.slice(0, 10).map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={alert.is_fraudulent ? "destructive" : "secondary"}
                        className="text-xs"
                      >
                        {alert.is_fraudulent ? "Fraudulento" : "Suspeito"}
                      </Badge>
                      <span className="font-medium text-sm">
                        Score: {alert.fraud_score}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      IP: {alert.visitor_ip} • {alert.listing_title || 'N/A'} • {alert.affiliate_code || 'N/A'}
                    </div>
                    {alert.reasons && alert.reasons.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Motivos: {alert.reasons.join(", ")}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(alert.clicked_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(!fraudAlerts || fraudAlerts.length === 0) && (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <div>Nenhuma atividade suspeita detectada nas últimas 24 horas</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}