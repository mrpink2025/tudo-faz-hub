import { TelemetryProvider } from '@/components/monitoring/TelemetryProvider';
import { HealthCheckWidget } from '@/components/monitoring/HealthCheckWidget';
import { MonitoringDashboard } from '@/components/monitoring/MonitoringDashboard';
import { FraudDetectionMonitor } from '@/components/affiliate/FraudDetectionMonitor';
import { ActivityLogsComponent } from '@/components/admin/ActivityLogsComponent';

const Monitoring = () => {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold">Monitoramento e Segurança</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FraudDetectionMonitor />
        <HealthCheckWidget />
      </div>
      
      <MonitoringDashboard />
      <ActivityLogsComponent />
    </div>
  );
};

export default Monitoring;