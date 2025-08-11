import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const statuses = ["pending", "paid", "canceled"] as const;

export default function OrdersTable() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, amount, currency, status, created_at, user_id, listing_id")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Status atualizado" });
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: (e: any) => toast({ title: "Erro ao atualizar status", description: e.message }),
  });

  return (
    <section id="pedidos" className="space-y-4">
      <header>
        <h2 className="text-xl font-semibold">Pedidos</h2>
        <p className="text-sm text-muted-foreground">Acompanhe os últimos pedidos e atualize o status.</p>
      </header>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Carregando…</div>
      ) : data && data.length ? (
        <div className="grid gap-3">
          {data.map((o: any) => (
            <Card key={o.id}>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">Pedido {o.id.slice(0, 8)}</CardTitle>
                <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</div>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                  {o.currency ?? "BRL"} {o.amount ?? 0} • usuario: {o.user_id?.slice(0, 8)} • anúncio: {o.listing_id?.slice(0, 8)}
                </div>
                <Select value={o.status ?? "pending"} onValueChange={(v) => updateStatus.mutate({ id: o.id, status: v })}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">Nenhum pedido encontrado.</div>
      )}
    </section>
  );
}
