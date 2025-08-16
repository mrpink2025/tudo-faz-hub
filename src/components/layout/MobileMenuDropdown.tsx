import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface MobileMenuDropdownProps {
  user: any;
}

export const MobileMenuDropdown = ({ user }: MobileMenuDropdownProps) => {
  const { t } = useTranslation();

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
          <Menu className="h-4 w-4 mr-1" />
          Menu
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-popover text-foreground z-50">
        <DropdownMenuItem asChild>
          <NavLink to="/mensagens" className="w-full flex items-center">
            {t("nav.messages")}
          </NavLink>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <NavLink to="/creditos" className="w-full flex items-center">
            {t("credits.nav")}
          </NavLink>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <NavLink to="/afiliados" className="w-full flex items-center">
            Afiliados
          </NavLink>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <NavLink to="/anunciante" className="w-full flex items-center">
            Anunciante
          </NavLink>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <NavLink to="/pedidos" className="w-full flex items-center">
            Pedidos
          </NavLink>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};