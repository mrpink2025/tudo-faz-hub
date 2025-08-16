import { SalesReportsPanel } from "@/components/admin/SalesReportsPanel";
import { SEOHead } from "@/components/seo/SEOHead";

export default function AdminSalesReports() {
  return (
    <>
      <SEOHead 
        title="Relatórios de Vendas - Admin"
        description="Análise detalhada de vendas, métricas de performance e relatórios do marketplace."
      />
      
      <div className="space-y-6">
        <SalesReportsPanel />
      </div>
    </>
  );
}