import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)] as const;
}

export function useBranding() {
  const { data } = useQuery({
    queryKey: ["site-settings-public"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings_public").select("brand_primary, brand_accent").maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!data) return;
    const root = document.documentElement;

    const parseRgb = (val?: string | null) => {
      if (!val) return null;
      const m = val.match(/(\d{1,3})\D+(\d{1,3})\D+(\d{1,3})/);
      if (!m) return null;
      const [r, g, b] = [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])];
      return { r, g, b };
    };

    const primary = parseRgb(data.brand_primary ?? undefined) || { r: 59, g: 130, b: 246 }; // default blue
    const accent = parseRgb(data.brand_accent ?? undefined) || { r: 139, g: 92, b: 246 };

    const [ph, ps, pl] = rgbToHsl(primary.r, primary.g, primary.b);
    const [ah, as, al] = rgbToHsl(accent.r, accent.g, accent.b);

    root.style.setProperty("--brand", `${ph} ${ps}% ${pl}%`);
    root.style.setProperty("--brand-2", `${ah} ${as}% ${al}%`);
    root.style.setProperty("--brand-glow", `${ph} ${Math.min(100, ps + 15)}% ${Math.min(100, pl + 15)}%`);
    root.style.setProperty("--primary", `${ph} ${ps}% ${pl}%`);
    root.style.setProperty("--ring", `${ph} ${ps}% ${pl}%`);
  }, [data]);
}

export function BrandingLoader() {
  useBranding();
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const root = document.documentElement;
    if (stored === "dark") root.classList.add("dark");
    if (stored === "light") root.classList.remove("dark");
  }, []);
  return null;
}
