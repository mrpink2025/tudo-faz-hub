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
        // Buscar da tabela pública que tem acesso liberado
        const { data: userData } = await fetch(
          'https://jprmzutdujnufjyvxtss.supabase.co/rest/v1/site_settings_public?select=logo_url',
          {
            headers: {
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impwcm16dXRkdWpudWZqeXZ4dHNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5Mzc0MDMsImV4cCI6MjA3MDUxMzQwM30.oLRzf4v6IJvWuulfoZVwya6T8AUEWmN2pQNs6kZ4Qhc',
              'Content-Type': 'application/json'
            }
          }
        ).then(res => res.json());
        
        if (userData && userData.length > 0 && userData[0].logo_url) {
          // Adicionar cache bust baseado no timestamp atual + random
          const cacheBust = `?v=${Date.now()}&r=${Math.random()}`;
          const logoWithCacheBust = `${userData[0].logo_url}${cacheBust}`;
          setLogoUrl(logoWithCacheBust);
        } else {
          setLogoUrl(defaultLogo);
        }
      } catch (error) {
        console.log('Error fetching logo:', error);
        setLogoUrl(defaultLogo);
      }
    };

    fetchLogo();
    
    // Polling para atualizar o logo periodicamente enquanto no admin
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