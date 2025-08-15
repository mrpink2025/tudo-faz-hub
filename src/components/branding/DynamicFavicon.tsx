import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const DynamicFavicon = () => {
  const { data: settings } = useQuery({
    queryKey: ["site-settings-public-favicon"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings_public")
        .select("logo_url, favicon_url")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    // Usar favicon_url se disponível, senão usar logo_url, senão usar fallback
    const faviconUrl = settings?.favicon_url || 
                      settings?.logo_url || 
                      "/lovable-uploads/a87f8885-b030-49a0-904c-ef954b5ed0aa.png";

    // Remover favicon existente
    const existingFavicon = document.querySelector('link[rel="icon"]');
    if (existingFavicon) {
      existingFavicon.remove();
    }

    // Criar novo favicon
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/png';
    link.href = faviconUrl;
    
    document.head.appendChild(link);
  }, [settings]);

  return null; // Este componente não renderiza nada visível
};

export default DynamicFavicon;