import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Menu, User, MessageCircle, DollarSign, Users, Megaphone, Package, Shield, LogOut } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";

interface MobileMenuDropdownProps {
  user: any;
}

export const MobileMenuDropdown = ({ user }: MobileMenuDropdownProps) => {
  const { t } = useTranslation();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();

  const handleAdminNavigation = () => {
    window.location.href = '/admin';
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
          <Menu className="h-4 w-4 mr-1" />
          {t("nav.menu")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-background/95 backdrop-blur-sm text-foreground z-50 w-56 border border-border/50 shadow-lg">
        {/* Meu Perfil como primeira opção */}
        <DropdownMenuItem asChild className="cursor-pointer">
          <NavLink to="/perfil" className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent/50 transition-colors">
            <User className="w-4 h-4 text-primary" />
            <span className="font-medium">Meu Perfil</span>
          </NavLink>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild className="cursor-pointer">
          <NavLink to="/mensagens" className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent/50 transition-colors">
            <MessageCircle className="w-4 h-4 text-primary" />
            <span>{t("nav.messages")}</span>
          </NavLink>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild className="cursor-pointer">
          <NavLink to="/creditos" className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent/50 transition-colors">
            <DollarSign className="w-4 h-4 text-primary" />
            <span>{t("credits.nav")}</span>
          </NavLink>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild className="cursor-pointer">
          <NavLink to="/afiliados" className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent/50 transition-colors">
            <Users className="w-4 h-4 text-primary" />
            <span>{t("nav.affiliates")}</span>
          </NavLink>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild className="cursor-pointer">
          <NavLink to="/anunciante" className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent/50 transition-colors">
            <Megaphone className="w-4 h-4 text-primary" />
            <span>{t("nav.advertiser")}</span>
          </NavLink>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild className="cursor-pointer">
          <NavLink to="/pedidos" className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent/50 transition-colors">
            <Package className="w-4 h-4 text-primary" />
            <span>{t("nav.orders")}</span>
          </NavLink>
        </DropdownMenuItem>
        
        {isAdmin && (
          <DropdownMenuItem onClick={handleAdminNavigation} className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent/50 transition-colors cursor-pointer">
            <Shield className="w-4 h-4 text-destructive" />
            <span className="text-destructive font-medium">{t("nav.admin_panel")}</span>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-3 px-4 py-2.5 hover:bg-destructive/10 text-destructive hover:text-destructive transition-colors cursor-pointer">
          <LogOut className="w-4 h-4" />
          <span>{t("nav.logout")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};