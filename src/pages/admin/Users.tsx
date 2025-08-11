import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { TablesInsert, Enums } from "@/integrations/supabase/types";

export default function AdminUsers() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [userId, setUserId] = useState("");
  const roles = ["admin", "moderator", "user"] as const;
  const [role, setRole] = useState<(typeof roles)[number]>("admin");

  const { data, isLoading } = useQuery({
    queryKey: ["user-roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("id,user_id,role").order("role");
      if (error) throw error;
      return data ?? [];
    },
  });

  const addRole = useMutation({
    mutationFn: async () => {
      const payload: TablesInsert<'user_roles'> = { user_id: userId as any, role: role as Enums<'app_role'> };
      const { error } = await supabase.from("user_roles").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Papel adicionado" });
      setUserId("");
      qc.invalidateQueries({ queryKey: ["user-roles"] });
    },
    onError: (e: any) => toast({ title: "Erro ao adicionar", description: e.message }),
  });

  const removeRole = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_roles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Papel removido" });
      qc.invalidateQueries({ queryKey: ["user-roles"] });
    },
    onError: (e: any) => toast({ title: "Erro ao remover", description: e.message }),
  });

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-xl font-semibold">Gerenciar usuários</h2>
        <p className="text-sm text-muted-foreground">Adicionar ou remover papéis (roles) por user_id.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Atribuir papel</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-2">
          <Input placeholder="UUID do usuário" value={userId} onChange={(e) => setUserId(e.target.value)} className="md:w-[360px]" />
          <Select value={role} onValueChange={(v) => setRole(v as (typeof roles)[number])}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Papel" /></SelectTrigger>
            <SelectContent>
              {roles.map((r) => (<SelectItem key={r} value={r}>{r}</SelectItem>))}
            </SelectContent>
          </Select>
          <Button onClick={() => addRole.mutate()} disabled={!userId}>Atribuir</Button>
        </CardContent>
      </Card>

      <div className="grid gap-3">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Carregando…</div>
        ) : data && data.length ? (
          data.map((ur: any) => (
            <Card key={ur.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="text-sm">{ur.role} • {ur.user_id}</div>
                <Button variant="destructive" size="sm" onClick={() => removeRole.mutate(ur.id)}>Remover</Button>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-sm text-muted-foreground">Nenhum papel encontrado.</div>
        )}
      </div>
    </section>
  );
}
