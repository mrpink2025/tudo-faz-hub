import { useHealthCheck } from '@/hooks/useHealthCheck';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Database, Shield, HardDrive, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HealthCheckWidgetProps {
  showDetails?: boolean;
  className?: string;
}

export const HealthCheckWidget = ({ showDetails = false, className }: HealthCheckWidgetProps) => {
  const { health, loading, runHealthCheck } = useHealthCheck();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'unhealthy': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'healthy': return 'Todos os sistemas operacionais';
      case 'degraded': return 'Alguns sistemas com problemas';
      case 'unhealthy': return 'Múltiplos sistemas com falha';
      default: return 'Status desconhecido';
    }
  };

  const healthChecks = [
    { key: 'database', label: 'Banco de Dados', icon: Database },
    { key: 'auth', label: 'Autenticação', icon: Shield },
    { key: 'storage', label: 'Armazenamento', icon: HardDrive },
    { key: 'api', label: 'API', icon: Globe }
  ];

  if (!showDetails) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className={cn("w-2 h-2 rounded-full", getStatusColor(health.status))} />
        <span className="text-sm text-muted-foreground">
          {getStatusText(health.status)}
        </span>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Status do Sistema
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={runHealthCheck}
          disabled={loading}
          className="h-8 w-8 p-0"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Status Geral</span>
            <Badge 
              variant={health.status === 'healthy' ? 'default' : 'destructive'}
              className={cn(
                "text-xs",
                health.status === 'healthy' && "bg-green-100 text-green-800 hover:bg-green-100",
                health.status === 'degraded' && "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
              )}
            >
              {health.status}
            </Badge>
          </div>
          
          <div className="space-y-2">
            {healthChecks.map(({ key, label, icon: Icon }) => (
              <div key={key} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{label}</span>
                </div>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  health.checks[key as keyof typeof health.checks] ? "bg-green-500" : "bg-red-500"
                )} />
              </div>
            ))}
          </div>

          <div className="pt-2 border-t text-xs text-muted-foreground">
            <div>Última verificação: {health.lastCheck.toLocaleTimeString()}</div>
            <div>Tempo de resposta: {Math.round(health.responseTime)}ms</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};