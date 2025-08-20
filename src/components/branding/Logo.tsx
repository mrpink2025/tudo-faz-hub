import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

type LogoProps = {
  className?: string;
  title?: string;
};

const Logo: React.FC<LogoProps> = ({ className, title = "tudofaz" }) => {
  const defaultLogo = "/lovable-uploads/a87f8885-b030-49a0-904c-ef954b5ed0aa.png";
  const [logoUrl, setLogoUrl] = useState(defaultLogo);

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        // Use the secure Supabase client instead of hardcoded credentials
        const { data: userData, error } = await supabase.rpc('get_site_settings_public');
        
        if (error) {
          throw error;
        }
        
        if (userData && userData.length > 0 && userData[0].logo_url) {
          // Force new logo with cache bust only on the image
          const imageWithCacheBust = `${userData[0].logo_url}?v=${Date.now()}`;
          setLogoUrl(imageWithCacheBust);
        } else {
          // Use new logo by default
          setLogoUrl('/lovable-uploads/6f5f4a0d-1623-414f-8740-4490d8c09adb.png');
        }
      } catch (error) {
        console.log('Error fetching logo:', error);
        // Use new logo in case of error
        setLogoUrl('/lovable-uploads/6f5f4a0d-1623-414f-8740-4490d8c09adb.png');
      }
    };

    // Fetch inicial
    fetchLogo();
    
    // Polling para atualizações
    const interval = setInterval(fetchLogo, 3000);
    
    return () => clearInterval(interval);
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