import * as React from "react";
import { cn } from "@/lib/utils";

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
  currency?: string;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value, onChange, currency = "R$", ...props }, ref) => {
    const formatCurrency = (rawValue: string): string => {
      // Remove tudo que não é dígito
      const numericValue = rawValue.replace(/\D/g, '');
      
      // Se vazio, retorna vazio
      if (!numericValue) return '';
      
      // Converte para número (centavos) e formata
      const numberValue = parseInt(numericValue);
      
      // Formata como moeda brasileira
      return (numberValue / 100).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    };

    const parseValue = (formattedValue: string): string => {
      // Remove tudo que não é dígito
      const numericValue = formattedValue.replace(/\D/g, '');
      
      if (!numericValue) return '';
      
      // Retorna o valor em reais (não centavos)
      return (parseInt(numericValue) / 100).toString();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const formatted = formatCurrency(inputValue);
      const parsed = parseValue(inputValue);
      
      // Atualiza o display
      e.target.value = formatted;
      
      // Chama onChange com o valor numérico
      onChange(parsed);
    };

    const displayValue = React.useMemo(() => {
      if (!value) return '';
      const numericValue = parseFloat(value);
      if (isNaN(numericValue)) return '';
      
      return numericValue.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }, [value]);

    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
          {currency}
        </span>
        <input
          type="text"
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background pl-12 pr-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            className
          )}
          ref={ref}
          defaultValue={displayValue}
          onChange={handleChange}
          placeholder="0,00"
          {...props}
        />
      </div>
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };