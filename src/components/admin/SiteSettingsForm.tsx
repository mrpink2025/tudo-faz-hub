import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

export default function SiteSettingsForm() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [file, setFile] = useState<File | null>(null);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const update = useMutation({
    mutationFn: async (payload: any) => {
      const { error } = await supabase.from("site_settings").update(payload).eq("id", 1);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Configurações salvas" });
      qc.invalidateQueries({ queryKey: ["site-settings"] });
    },
    onError: (e: any) => toast({ title: "Erro ao salvar", description: e.message }),
  });

  const handleUploadLogo = async () => {
    if (!file) return;
    const path = `logos/site-logo.png`;
    const { error } = await supabase.storage.from("assets").upload(path, file, { upsert: true, contentType: file.type });
    if (error) {
      toast({ title: "Erro ao enviar logo", description: error.message });
      return;
    }
    const { data } = supabase.storage.from("assets").getPublicUrl(path);
    update.mutate({ logo_url: data.publicUrl });
  };

  if (isLoading) return (
    <section id="configuracoes" className="space-y-4"><div className="text-sm text-muted-foreground">Carregando…</div></section>
  );

  return (
    <section id="configuracoes" className="space-y-4">
      <header>
        <h2 className="text-xl font-semibold">Configurações do site</h2>
        <p className="text-sm text-muted-foreground">Atualize o nome do site, logo, cores e conteúdo promocional.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Identidade</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <label className="text-sm">Nome do site</label>
            <Input defaultValue={settings?.site_name ?? ""} onBlur={(e) => update.mutate({ site_name: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <label className="text-sm">Logo</label>
            <div className="flex items-center gap-2">
              <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              <Button type="button" onClick={handleUploadLogo} disabled={!file}>Enviar</Button>
            </div>
            {settings?.logo_url && (
              <img src={settings.logo_url} alt="Logo do tudofaz" className="h-12 w-auto mt-2" loading="lazy" />
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cores</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <label className="text-sm">Primária (hex)</label>
            <Input defaultValue={settings?.brand_primary ?? ""} onBlur={(e) => update.mutate({ brand_primary: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <label className="text-sm">Acento (hex)</label>
            <Input defaultValue={settings?.brand_accent ?? ""} onBlur={(e) => update.mutate({ brand_accent: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Promo</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm">HTML promocional</label>
            <Textarea defaultValue={settings?.promo_html ?? ""} rows={6} onBlur={(e) => update.mutate({ promo_html: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pagamentos</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center gap-2">
            <Checkbox id="stripe_enabled" checked={!!settings?.stripe_enabled} onCheckedChange={(v) => update.mutate({ stripe_enabled: !!v })} />
            <label htmlFor="stripe_enabled" className="text-sm">Stripe habilitado</label>
          </div>
          <div className="grid gap-2 md:col-span-2">
            <label className="text-sm">Stripe Publishable Key</label>
            <Input defaultValue={settings?.stripe_publishable_key ?? ""} onBlur={(e) => update.mutate({ stripe_publishable_key: e.target.value })} />
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
