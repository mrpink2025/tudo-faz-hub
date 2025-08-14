import { useCallback } from "react";
import { messageRateLimiter, listingRateLimiter, authRateLimiter } from "@/utils/rateLimiter";
import { useSupabaseAuth } from "./useSupabaseAuth";
import { useToast } from "./use-toast";
import { useTranslation } from "react-i18next";

type RateLimitType = 'message' | 'listing' | 'auth';

export function useRateLimit() {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  const checkRateLimit = useCallback((type: RateLimitType, customIdentifier?: string): boolean => {
    const identifier = customIdentifier || user?.id || 'anonymous';
    
    let limiter;
    let actionName;
    
    switch (type) {
      case 'message':
        limiter = messageRateLimiter;
        actionName = 'envio de mensagens';
        break;
      case 'listing':
        limiter = listingRateLimiter;
        actionName = 'criação de anúncios';
        break;
      case 'auth':
        limiter = authRateLimiter;
        actionName = 'tentativas de login';
        break;
      default:
        return false;
    }

    if (limiter.isRateLimited(identifier)) {
      const remaining = limiter.getRemainingRequests(identifier);
      const resetTime = limiter.getResetTime(identifier);
      const waitTime = resetTime ? Math.ceil((resetTime - Date.now()) / 1000 / 60) : 1;
      
      toast({
        title: "Limite de taxa excedido",
        description: `Você excedeu o limite de ${actionName}. Tente novamente em ${waitTime} minuto(s).`,
        variant: "destructive"
      });
      
      return true;
    }
    
    return false;
  }, [user?.id, toast]);

  const getRemainingRequests = useCallback((type: RateLimitType, customIdentifier?: string): number => {
    const identifier = customIdentifier || user?.id || 'anonymous';
    
    switch (type) {
      case 'message':
        return messageRateLimiter.getRemainingRequests(identifier);
      case 'listing':
        return listingRateLimiter.getRemainingRequests(identifier);
      case 'auth':
        return authRateLimiter.getRemainingRequests(identifier);
      default:
        return 0;
    }
  }, [user?.id]);

  return { checkRateLimit, getRemainingRequests };
}