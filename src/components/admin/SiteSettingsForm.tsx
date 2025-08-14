import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

function parseRgbString(val?: string | null) {
  if (!val) return { r: 59, g: 130, b: 246 };
  const m = val.match(/(\d{1,3})\D+(\d{1,3})\D+(\d{1,3})/);
  if (!m) return { r: 59, g: 130, b: 246 };
  return { r: Math.min(255, +m[1]), g: Math.min(255, +m[2]), b: Math.min(255, +m[3]) };
}

export default function SiteSettingsForm() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);

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
      toast({ title: t("admin.settings.saved") });
      qc.invalidateQueries({ queryKey: ["site-settings"] });
    },
    onError: (e: any) => toast({ title: t("admin.settings.save_error"), description: e.message }),
  });

  const handleUploadLogo = async () => {
    if (!logoFile) return;
    const path = `logos/site-logo.png`;
    const { error } = await supabase.storage.from("assets").upload(path, logoFile, { upsert: true, contentType: logoFile.type });
    if (error) {
      toast({ title: t("admin.settings.upload_error_logo"), description: error.message });
      return;
    }
    const { data } = supabase.storage.from("assets").getPublicUrl(path);
    update.mutate({ logo_url: data.publicUrl });
  };

  const handleUploadHero = async () => {
    if (!heroFile) return;
    const path = `hero/hero-image.jpg`;
    const { error } = await supabase.storage.from("assets").upload(path, heroFile, { upsert: true, contentType: heroFile.type });
    if (error) {
      toast({ title: t("admin.settings.upload_error_hero"), description: error.message });
      return;
    }
    const { data } = supabase.storage.from("assets").getPublicUrl(path);
    update.mutate({ hero_image_url: data.publicUrl });
  };

  const handleUploadFavicon = async () => {
    if (!faviconFile) return;
    const path = `favicon/favicon.png`;
    const { error } = await supabase.storage.from("assets").upload(path, faviconFile, { upsert: true, contentType: faviconFile.type });
    if (error) {
      toast({ title: t("admin.settings.upload_error_favicon"), description: error.message });
      return;
    }
    const { data } = supabase.storage.from("assets").getPublicUrl(path);
    update.mutate({ favicon_url: data.publicUrl });
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
    <section id="configuracoes" className="space-y-4"><div className="text-sm text-muted-foreground">{t("common.loading")}</div></section>
  );

  return (
    <section id="configuracoes" className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold">{t("admin.settings.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("admin.settings.subtitle")}</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.settings.identity")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <label className="text-sm">{t("admin.settings.site_name")}</label>
            <Input defaultValue={settings?.site_name ?? ""} onBlur={(e) => update.mutate({ site_name: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <label className="text-sm">{t("admin.settings.logo")}</label>
            <div className="flex items-center gap-2">
              <Input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)} />
              <Button type="button" onClick={handleUploadLogo} disabled={!logoFile}>{t("common.send")}</Button>
            </div>
            {settings?.logo_url && (
              <img src={settings.logo_url} alt="Logo do tudofaz" className="h-12 w-auto mt-2" loading="lazy" />
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.settings.color_palette")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">{t("admin.settings.primary")}</span>
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
              <span className="text-sm">{t("admin.settings.accent")}</span>
              <div className="h-6 w-16 rounded border" style={{ backgroundColor: accentPreview }} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Input type="number" min={0} max={255} value={accentRgb.r} onChange={(e) => setAccentRgb({ ...accentRgb, r: +e.target.value })} />
              <Input type="number" min={0} max={255} value={accentRgb.g} onChange={(e) => setAccentRgb({ ...accentRgb, g: +e.target.value })} />
              <Input type="number" min={0} max={255} value={accentRgb.b} onChange={(e) => setAccentRgb({ ...accentRgb, b: +e.target.value })} />
            </div>
          </div>
          <div className="md:col-span-2">
            <Button onClick={persistColors}>{t("admin.settings.save_palette")}</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.settings.theme")}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setTheme("light")}>{t("admin.settings.light_mode")}</Button>
          <Button onClick={() => setTheme("dark")}>{t("admin.settings.dark_mode")}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.settings.site_images")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid gap-2">
            <label className="text-sm">{t("admin.settings.hero_image")}</label>
            <div className="flex items-center gap-2">
              <Input type="file" accept="image/*" onChange={(e) => setHeroFile(e.target.files?.[0] ?? null)} />
              <Button type="button" onClick={handleUploadHero} disabled={!heroFile}>{t("common.send")}</Button>
            </div>
            {settings?.hero_image_url && (
              <img src={settings.hero_image_url} alt="Imagem Hero" className="h-24 w-auto mt-2 rounded" loading="lazy" />
            )}
          </div>
          <div className="grid gap-2">
            <label className="text-sm">{t("admin.settings.favicon")}</label>
            <div className="flex items-center gap-2">
              <Input type="file" accept="image/png,image/jpg,image/jpeg" onChange={(e) => setFaviconFile(e.target.files?.[0] ?? null)} />
              <Button type="button" onClick={handleUploadFavicon} disabled={!faviconFile}>{t("common.send")}</Button>
            </div>
            {settings?.favicon_url && (
              <img src={settings.favicon_url} alt="Favicon" className="h-8 w-8 mt-2" loading="lazy" />
            )}
            <p className="text-xs text-muted-foreground">{t("admin.settings.favicon_note")}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.settings.promo")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm">{t("admin.settings.promo_html")}</label>
            <Textarea defaultValue={settings?.promo_html ?? ""} rows={6} onBlur={(e) => update.mutate({ promo_html: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.settings.payments")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center gap-2">
            <Checkbox id="stripe_enabled" checked={!!settings?.stripe_enabled} onCheckedChange={(v) => update.mutate({ stripe_enabled: !!v })} />
            <label htmlFor="stripe_enabled" className="text-sm">{t("admin.settings.stripe_enabled")}</label>
          </div>
          <div className="grid gap-2 md:col-span-2">
            <label className="text-sm">{t("admin.settings.stripe_key")}</label>
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
