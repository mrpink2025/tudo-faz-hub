import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

export default function AdminOverview() {
  const { data, isLoading } = useQuery({ queryKey: ["admin-stats"], queryFn: fetchAdminStats });
  return (
    <section className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle>Anúncios pendentes</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{isLoading ? "—" : data?.pending}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Total de anúncios</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{isLoading ? "—" : data?.listings}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Pedidos</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{isLoading ? "—" : data?.orders}</p></CardContent>
        </Card>
      </div>
      <div className="text-sm text-muted-foreground">Use o menu lateral para navegar.</div>
    </section>
  );
}
