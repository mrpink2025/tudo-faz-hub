import { TelemetryProvider } from '@/components/monitoring/TelemetryProvider';
import { HealthCheckWidget } from '@/components/monitoring/HealthCheckWidget';
import { MonitoringDashboard } from '@/components/monitoring/MonitoringDashboard';

const Monitoring = () => {
  return (
    <div className="container mx-auto py-6">
      <MonitoringDashboard />
    </div>
  );
};

export default Monitoring;