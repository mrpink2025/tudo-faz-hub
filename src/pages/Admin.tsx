import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ModerateListings from "@/components/admin/ModerateListings";
import OrdersTable from "@/components/admin/OrdersTable";
import SiteSettingsForm from "@/components/admin/SiteSettingsForm";

const fetchAdminStats = async () => {
  const [pendingListings, totalListings, totalOrders] = await Promise.all([
    supabase.from("listings").select("id", { count: "exact", head: true }).eq("approved", false),
    supabase.from("listings").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("id", { count: "exact", head: true }),
  ]);

  if (pendingListings.error) throw pendingListings.error;
  if (totalListings.error) throw totalListings.error;
  if (totalOrders.error) throw totalOrders.error;

  return {
    pending: pendingListings.count ?? 0,
    listings: totalListings.count ?? 0,
    orders: totalOrders.count ?? 0,
  };
};

export default function Admin() {
  useEffect(() => {
    document.title = "Admin | tudofaz";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Painel administrativo do tudofaz: modere anúncios, veja pedidos e configure o site.");
    const link = document.querySelector('link[rel="canonical"]') || document.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', `${window.location.origin}/admin`);
    if (!link.parentNode) document.head.appendChild(link);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: fetchAdminStats,
  });

  return (
    <SidebarProvider>
      <header className="h-12 flex items-center border-b px-3">
        <SidebarTrigger className="mr-2" />
        <h1 className="text-lg font-semibold">Painel Administrativo</h1>
      </header>

      <div className="flex min-h-[calc(100vh-3rem)] w-full">
        <AdminSidebar />

        <main className="flex-1 p-4 md:p-6 space-y-8">
          {/* Resumo */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Anúncios pendentes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{isLoading ? "—" : data?.pending}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Total de anúncios</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{isLoading ? "—" : data?.listings}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pedidos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{isLoading ? "—" : data?.orders}</p>
              </CardContent>
            </Card>
          </section>

          {/* Moderação de anúncios */}
          <ModerateListings />

          {/* Pedidos */}
          <OrdersTable />

          {/* Configurações do site */}
          <SiteSettingsForm />
        </main>
      </div>
    </SidebarProvider>
  );
}
