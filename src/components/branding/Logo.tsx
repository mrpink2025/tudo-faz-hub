import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

type LogoProps = {
  className?: string;
  title?: string;
};

const Logo: React.FC<LogoProps> = ({ className, title = "tudofaz" }) => {
  const defaultLogo = "/lovable-uploads/35efc0ad-a245-43eb-8397-fc5392b06da7.png";
  const [logoUrl, setLogoUrl] = useState(defaultLogo);

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const { data, error } = await supabase
          .from("site_settings_public")
          .select("logo_url")
          .single();
        
        if (!error && data?.logo_url) {
          setLogoUrl(data.logo_url);
        } else {
          setLogoUrl(defaultLogo);
        }
      } catch (error) {
        console.log('Error fetching logo:', error);
        setLogoUrl(defaultLogo);
      }
    };

    fetchLogo();
  }, []);

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