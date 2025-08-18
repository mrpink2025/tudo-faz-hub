import { useTranslation } from 'react-i18next';
import { TelemetryProvider } from '@/components/monitoring/TelemetryProvider';
import { HealthCheckWidget } from '@/components/monitoring/HealthCheckWidget';
import { MonitoringDashboard } from '@/components/monitoring/MonitoringDashboard';
import { FraudDetectionMonitor } from '@/components/affiliate/FraudDetectionMonitor';
import { ActivityLogsComponent } from '@/components/admin/ActivityLogsComponent';
import { SEOHead } from '@/components/seo/SEOHead';

const Monitoring = () => {
  const { t } = useTranslation();
  
  return (
    <>
      <SEOHead 
        title={t("admin.monitoring.title")}
        description="Dashboard de monitoramento e segurança da plataforma"
      />
      
      <div className="container mx-auto py-6 space-y-6">
        <h1 className="text-3xl font-bold">{t("admin.monitoring.title")}</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FraudDetectionMonitor />
        <HealthCheckWidget />
      </div>
      
        <MonitoringDashboard />
        <ActivityLogsComponent />
      </div>
    </>
  );
};

export default Monitoring;