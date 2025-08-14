import React from "react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type LogoProps = {
  className?: string;
  title?: string;
};

const Logo: React.FC<LogoProps> = ({ className, title = "tudofaz" }) => {
  const { data: settings } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("logo_url")
        .eq("id", 1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Fallback para logo padrão se não houver logo configurada
  const logoUrl = settings?.logo_url || "/lovable-uploads/35efc0ad-a245-43eb-8397-fc5392b06da7.png";

  return (
    <img
      src={logoUrl}
      alt={title}
      className={cn("block h-9 w-auto object-contain", className)}
      loading="eager"
      style={{ maxWidth: '100%' }}
    />
  );
};

export default Logo;
