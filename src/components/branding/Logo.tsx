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
        // Usar a função RPC sem cache bust na URL
        const response = await fetch(
          'https://jprmzutdujnufjyvxtss.supabase.co/rest/v1/rpc/get_site_settings_public',
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
          // Forçar novo logo com cache bust apenas na imagem
          const imageWithCacheBust = `${userData[0].logo_url}?v=${Date.now()}`;
          setLogoUrl(imageWithCacheBust);
        } else {
          // Usar novo logo por padrão
          setLogoUrl('/lovable-uploads/6f5f4a0d-1623-414f-8740-4490d8c09adb.png');
        }
      } catch (error) {
        console.log('Error fetching logo:', error);
        // Usar novo logo em caso de erro
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