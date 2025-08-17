import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useBackgroundRemoval } from "@/hooks/useBackgroundRemoval";

type LogoProps = {
  className?: string;
  title?: string;
};

const Logo: React.FC<LogoProps> = ({ className, title = "tudofaz" }) => {
  const defaultLogo = "/lovable-uploads/a87f8885-b030-49a0-904c-ef954b5ed0aa.png";
  const [logoUrl, setLogoUrl] = useState(defaultLogo);
  const [processedLogoUrl, setProcessedLogoUrl] = useState(defaultLogo);
  const { processImage, isProcessing } = useBackgroundRemoval();

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        // Usar a função RPC segura para buscar dados
        const response = await fetch(
          'https://jprmzutdujnufjyvxtss.supabase.co/rest/v1/rpc/get_site_settings_public',
          {
            method: 'POST',
            headers: {
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impwcm16dXRkdWpudWZqeXZ4dHNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5Mzc0MDMsImV4cCI6MjA3MDUxMzQwM30.oLRzf4v6IJvWuulfoZVwya6T8AUEWmN2pQNs6kZ4Qhc',
              'Content-Type': 'application/json'
            }
          }
        );
        
        const userData = await response.json();
        
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
    const interval = setInterval(fetchLogo, 5000); // Reduzido para 5 segundos
    
    return () => clearInterval(interval);
  }, []);

  // Process image to remove background when logoUrl changes
  useEffect(() => {
    const processLogo = async () => {
      if (logoUrl) {
        try {
          const processed = await processImage(logoUrl);
          setProcessedLogoUrl(processed);
        } catch (error) {
          console.error('Error processing logo:', error);
          setProcessedLogoUrl(logoUrl);
        }
      }
    };

    processLogo();
  }, [logoUrl, processImage]);

  return (
    <img
      src={processedLogoUrl}
      alt={title}
      className={cn("block h-9 w-auto object-contain", className, { 
        "opacity-70": isProcessing 
      })}
      loading="eager"
      style={{ maxWidth: '100%' }}
    />
  );
};

export default Logo;