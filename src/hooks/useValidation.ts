import { useCallback } from "react";
import { z, ZodSchema } from "zod";
import { useToast } from "./use-toast";

interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
}

export function useValidation() {
  const { toast } = useToast();

  const validate = useCallback(<T>(
    schema: ZodSchema<T>,
    data: unknown,
    showToast: boolean = true
  ): ValidationResult<T> => {
    try {
      const result = schema.parse(data);
      return { success: true, data: result };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        
        error.issues.forEach((err) => {
          const path = err.path.join('.');
          errors[path] = err.message;
        });

        if (showToast) {
          const firstError = Object.values(errors)[0];
          toast({
            title: "Erro de validação",
            description: firstError || "Dados inválidos",
            variant: "destructive"
          });
        }

        return { success: false, errors };
      }
      
      if (showToast) {
        toast({
          title: "Erro de validação",
          description: "Erro inesperado na validação",
          variant: "destructive"
        });
      }
      
      return { success: false };
    }
  }, [toast]);

  const validateField = useCallback(<T>(
    schema: ZodSchema<T>,
    data: unknown
  ): string | null => {
    try {
      schema.parse(data);
      return null;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.issues[0]?.message || "Campo inválido";
      }
      return "Erro de validação";
    }
  }, []);

  return { validate, validateField };
}