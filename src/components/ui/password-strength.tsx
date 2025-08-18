import { useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

interface PasswordCriteria {
  label: string;
  met: boolean;
}

const calculatePasswordStrength = (password: string, t: any) => {
  const criteria = [
    { label: t("password.min_8_chars"), met: password.length >= 8 },
    { label: t("password.uppercase"), met: /[A-Z]/.test(password) },
    { label: t("password.lowercase"), met: /[a-z]/.test(password) },
    { label: t("password.number"), met: /\d/.test(password) },
    { label: t("password.special_char"), met: /[!@#$%^&*(),.?":{}|<>]/.test(password) }
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

const getStrengthLabel = (strength: number, t: any) => {
  if (strength < 40) return t("password.weak");
  if (strength < 70) return t("password.medium");
  return t("password.strong");
};

export function PasswordStrength({ password, className }: PasswordStrengthProps) {
  const { t } = useTranslation();
  const { criteria, strength } = useMemo(() => calculatePasswordStrength(password, t), [password, t]);

  // Sempre mostrar os critérios, mesmo com senha vazia

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{t("password.strength")}:</span>
        <span className={cn(
          "font-medium",
          strength < 40 && "text-destructive",
          strength >= 40 && strength < 70 && "text-yellow-600",
          strength >= 70 && "text-green-600"
        )}>
          {getStrengthLabel(strength, t)}
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