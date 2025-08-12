import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "react-i18next";

const langs = [
  { code: "pt", label: "Português" },
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "zh", label: "中文" },
];

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const current = (i18n.language || "pt").split("-")[0];

  const changeLang = (code: string) => {
    i18n.changeLanguage(code);
    try { localStorage.setItem("lang", code); } catch {}
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" aria-label="Selecionar idioma" className="font-medium">
          {current.toUpperCase()}
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
