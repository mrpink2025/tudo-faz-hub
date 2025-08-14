import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export default function ModerateListings() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["pending-listings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("id,title,price,currency,created_at,highlighted")
        .eq("approved", false)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const approve = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("listings").update({ approved: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: t("admin.moderate.approved") });
      qc.invalidateQueries({ queryKey: ["pending-listings"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (e: any) => toast({ title: t("admin.moderate.approve_error"), description: e.message }),
  });

  const toggleHighlight = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: boolean }) => {
      const { error } = await supabase.from("listings").update({ highlighted: value }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Destaque atualizado" });
      qc.invalidateQueries({ queryKey: ["pending-listings"] });
    },
    onError: (e: any) => toast({ title: t("admin.moderate.highlight_error"), description: e.message }),
  });

  return (
    <section id="anuncios" className="space-y-4">
      <header>
        <h2 className="text-xl font-semibold">Moderação de anúncios</h2>
        <p className="text-sm text-muted-foreground">Aprove os anúncios pendentes e gerencie o destaque.</p>
      </header>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Carregando…</div>
      ) : data && data.length ? (
        <div className="grid gap-3">
          {data.map((l: any) => (
            <Card key={l.id}>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">{l.title}</CardTitle>
                <Badge variant={l.highlighted ? "default" : "secondary"}>
                  {l.highlighted ? "Destaque" : "Normal"}
                </Badge>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                  Criado em {new Date(l.created_at).toLocaleDateString()} • {l.price ? `${l.currency ?? "BRL"} ${l.price}` : "sem preço"}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => toggleHighlight.mutate({ id: l.id, value: !l.highlighted })}>
                    {l.highlighted ? "Remover destaque" : "Destacar"}
                  </Button>
                  <Button size="sm" onClick={() => approve.mutate(l.id)}>
                    Aprovar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">Não há anúncios pendentes.</div>
      )}
    </section>
  );
}
