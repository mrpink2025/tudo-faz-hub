import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { logger } from "@/utils/logger";

interface ErrorHandlerProps {
  error: Error | string;
  context?: string;
  showToast?: boolean;
}

export function ErrorHandler({ error, context = "app", showToast = true }: ErrorHandlerProps) {
  const { toast } = useToast();
  const { t } = useTranslation();

  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorStack = typeof error === 'string' ? undefined : error.stack;

  // Log error
  logger.error(`Error in ${context}: ${errorMessage}`, { error, stack: errorStack });

  // Show toast notification if enabled
  if (showToast) {
    toast({
      title: t("common.error"),
      description: errorMessage,
      variant: "destructive",
    });
  }

  return null;
}

// Hook for handling errors with consistent UX
export function useErrorHandler() {
  const { toast } = useToast();
  const { t } = useTranslation();

  return (error: Error | string, context?: string, showToast = true) => {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorStack = typeof error === 'string' ? undefined : error.stack;

    // Log error
    logger.error(`Error in ${context || "unknown"}: ${errorMessage}`, { 
      error, 
      stack: errorStack 
    });

    // Show toast notification if enabled
    if (showToast) {
      toast({
        title: t("common.error"),
        description: errorMessage,
        variant: "destructive",
      });
    }
  };
}