import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "react-i18next";

const LanguageSwitcher = () => {
  const { t, i18n } = useTranslation();

const langs = [
  { code: "pt", label: "Português" },
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "zh", label: "中文" },
];

  const currentLang = (i18n.language || "pt").split("-")[0];
  const current = currentLang === "pt" ? "BR" : currentLang.toUpperCase();

  const changeLang = (code: string) => {
    i18n.changeLanguage(code);
    try { 
      localStorage.setItem("lang", code);
    } catch {}
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={t("ui.language_selector")} className="font-medium">
          {current}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-popover text-foreground">
        {langs.map((l) => (
          <DropdownMenuItem key={l.code} onClick={() => changeLang(l.code)}>
            {l.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
