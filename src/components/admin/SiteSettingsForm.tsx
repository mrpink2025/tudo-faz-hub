import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

function parseRgbString(val?: string | null) {
  if (!val) return { r: 59, g: 130, b: 246 };
  const m = val.match(/(\d{1,3})\D+(\d{1,3})\D+(\d{1,3})/);
  if (!m) return { r: 59, g: 130, b: 246 };
  return { r: Math.min(255, +m[1]), g: Math.min(255, +m[2]), b: Math.min(255, +m[3]) };
}

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

  const [primaryRgb, setPrimaryRgb] = useState({ r: 59, g: 130, b: 246 });
  const [accentRgb, setAccentRgb] = useState({ r: 139, g: 92, b: 246 });

  useEffect(() => {
    if (!settings) return;
    setPrimaryRgb(parseRgbString(settings.brand_primary));
    setAccentRgb(parseRgbString(settings.brand_accent));
  }, [settings]);

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

  const primaryPreview = useMemo(() => `rgb(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b})`, [primaryRgb]);
  const accentPreview = useMemo(() => `rgb(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b})`, [accentRgb]);

  const persistColors = () => {
    update.mutate({
      brand_primary: `rgb(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b})`,
      brand_accent: `rgb(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b})`,
    });
  };

  const setTheme = (theme: "light" | "dark") => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("theme", theme);
  };

  if (isLoading) return (
    <section id="configuracoes" className="space-y-4"><div className="text-sm text-muted-foreground">Carregando…</div></section>
  );

  return (
    <section id="configuracoes" className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold">Configurações do site</h2>
        <p className="text-sm text-muted-foreground">Nome, logo, paleta de cores (RGB) e tema claro/escuro.</p>
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
          <CardTitle>Paleta de cores (RGB)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Primária</span>
              <div className="h-6 w-16 rounded border" style={{ backgroundColor: primaryPreview }} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Input type="number" min={0} max={255} value={primaryRgb.r} onChange={(e) => setPrimaryRgb({ ...primaryRgb, r: +e.target.value })} />
              <Input type="number" min={0} max={255} value={primaryRgb.g} onChange={(e) => setPrimaryRgb({ ...primaryRgb, g: +e.target.value })} />
              <Input type="number" min={0} max={255} value={primaryRgb.b} onChange={(e) => setPrimaryRgb({ ...primaryRgb, b: +e.target.value })} />
            </div>
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Acento</span>
              <div className="h-6 w-16 rounded border" style={{ backgroundColor: accentPreview }} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Input type="number" min={0} max={255} value={accentRgb.r} onChange={(e) => setAccentRgb({ ...accentRgb, r: +e.target.value })} />
              <Input type="number" min={0} max={255} value={accentRgb.g} onChange={(e) => setAccentRgb({ ...accentRgb, g: +e.target.value })} />
              <Input type="number" min={0} max={255} value={accentRgb.b} onChange={(e) => setAccentRgb({ ...accentRgb, b: +e.target.value })} />
            </div>
          </div>
          <div className="md:col-span-2">
            <Button onClick={persistColors}>Salvar paleta</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tema</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setTheme("light")}>Modo claro</Button>
          <Button onClick={() => setTheme("dark")}>Modo escuro</Button>
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
            <Input 
              placeholder="pk_live_..."
              defaultValue={settings?.stripe_publishable_key ?? "pk_live_51RvgiIRx02bCc2sPkyWKK6gnESAtpKxJNEpuw8qYNp4uzjQiD806GIIi93vArDSHGPXcJNE7XAtTPrUe0dmqPGp2001O10cOcc"} 
              onBlur={(e) => update.mutate({ stripe_publishable_key: e.target.value })} 
            />
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
