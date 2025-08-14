import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const DynamicFavicon = () => {
  const { data: settings } = useQuery({
    queryKey: ["site-settings-favicon"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("logo_url, favicon_url")
        .eq("id", 1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    // Usar favicon_url se disponível, senão usar logo_url, senão usar fallback
    const faviconUrl = settings?.favicon_url || 
                      settings?.logo_url || 
                      "/lovable-uploads/35efc0ad-a245-43eb-8397-fc5392b06da7.png";

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