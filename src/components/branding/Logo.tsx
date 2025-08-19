import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

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
        // Forçar refresh do logo com timestamp único
        const cacheBust = `?t=${Date.now()}`;
        const response = await fetch(
          `https://jprmzutdujnufjyvxtss.supabase.co/rest/v1/rpc/get_site_settings_public${cacheBust}`,
          {
            method: 'POST',
            headers: {
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impwcm16dXRkdWpudWZqeXZ4dHNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5Mzc0MDMsImV4cCI6MjA3MDUxMzQwM30.oLRzf4v6IJvWuulfoZVwya6T8AUEWmN2pQNs6kZ4Qhc',
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache'
            }
          }
        );
        
        const userData = await response.json();
        
        if (userData && userData.length > 0 && userData[0].logo_url) {
          // Adicionar cache bust mais agressivo
          const imageWithCacheBust = `${userData[0].logo_url}?v=${Date.now()}&r=${Math.random()}`;
          setLogoUrl(imageWithCacheBust);
        } else {
          setLogoUrl(defaultLogo);
        }
      } catch (error) {
        console.log('Error fetching logo:', error);
        setLogoUrl(defaultLogo);
      }
    };

    // Fetch inicial
    fetchLogo();
    
    // Polling mais frequente para garantir atualizações
    const interval = setInterval(fetchLogo, 2000);
    
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