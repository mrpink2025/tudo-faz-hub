import { useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

interface PasswordCriteria {
  label: string;
  met: boolean;
}

const calculatePasswordStrength = (password: string) => {
  const criteria = [
    { label: "Pelo menos 8 caracteres", met: password.length >= 8 },
    { label: "Uma letra maiúscula", met: /[A-Z]/.test(password) },
    { label: "Uma letra minúscula", met: /[a-z]/.test(password) },
    { label: "Um número", met: /\d/.test(password) },
    { label: "Um caractere especial", met: /[!@#$%^&*(),.?":{}|<>]/.test(password) }
  ];

  const metCount = criteria.filter(c => c.met).length;
  const strength = (metCount / criteria.length) * 100;

  return { criteria, strength, metCount };
};

const getStrengthColor = (strength: number) => {
  if (strength < 40) return "bg-destructive";
  if (strength < 70) return "bg-yellow-500";
  return "bg-green-500";
};

const getStrengthLabel = (strength: number) => {
  if (strength < 40) return "Fraca";
  if (strength < 70) return "Média";
  return "Forte";
};

export function PasswordStrength({ password, className }: PasswordStrengthProps) {
  const { criteria, strength } = useMemo(() => calculatePasswordStrength(password), [password]);

  if (!password) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Força da senha:</span>
        <span className={cn(
          "font-medium",
          strength < 40 && "text-destructive",
          strength >= 40 && strength < 70 && "text-yellow-600",
          strength >= 70 && "text-green-600"
        )}>
          {getStrengthLabel(strength)}
        </span>
      </div>
      
      <div className="relative">
        <Progress value={strength} className="h-2" />
        <div 
          className={cn(
            "absolute top-0 left-0 h-2 rounded-full transition-all duration-300",
            getStrengthColor(strength)
          )}
          style={{ width: `${strength}%` }}
        />
      </div>

      <div className="space-y-1">
        {criteria.map((criterion, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <div className={cn(
              "w-1.5 h-1.5 rounded-full",
              criterion.met ? "bg-green-500" : "bg-muted-foreground/30"
            )} />
            <span className={cn(
              criterion.met ? "text-green-600" : "text-muted-foreground"
            )}>
              {criterion.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}