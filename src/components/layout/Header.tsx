import { Link, NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import SearchBar from "@/components/SearchBar";
import CategoryMenu from "./CategoryMenu";
import MobileMenu from "./MobileMenu";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Logo from "@/components/branding/Logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import FeaturedListingsBar from "@/components/listings/FeaturedListingsBar";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslation } from "react-i18next";
import { NotificationCenter } from "@/components/NotificationCenter";
import { OrderNotifications } from "@/components/notifications/OrderNotifications";
import { MobileMenuDropdown } from "./MobileMenuDropdown";
import { ShoppingCartButton } from "@/components/ecommerce/ShoppingCartButton";

const Header = () => {
  const { user } = useSupabaseAuth();
  const { t } = useTranslation();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-gradient-to-r from-black to-[hsl(var(--brand))] backdrop-blur">
      <nav className="container flex h-16 items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="md:hidden">
            <MobileMenu />
          </div>
          <Link to="/" aria-label={t("nav.home_aria")} className="flex items-center gap-2">
            <Logo />
          </Link>
          <div className="hidden md:block">
            <CategoryMenu />
          </div>
        </div>

        {/* Mobile: Carrinho e Tradução na linha do logo */}
        <div className="flex md:hidden items-center gap-2">
          <ShoppingCartButton />
          <LanguageSwitcher />
        </div>

        <div className="flex-1 hidden md:block">
          <SearchBar />
        </div>

        <div className="hidden md:flex items-center gap-6 text-sm">
          <NavLink to="/explorar" className={({isActive}) => isActive ? "font-medium text-white" : "text-white hover:opacity-80"}>{t("nav.explore")}</NavLink>
          <NavLink to="/mensagens" className={({isActive}) => isActive ? "font-medium text-white" : "text-white hover:opacity-80"}>{t("nav.messages")}</NavLink>
          <NavLink to="/afiliados" className={({isActive}) => isActive ? "font-medium text-white" : "text-white hover:opacity-80"}>Afiliados</NavLink>
          <NavLink to="/anunciante" className={({isActive}) => isActive ? "font-medium text-white" : "text-white hover:opacity-80"}>Anunciante</NavLink>
          <NavLink to="/pedidos" className={({isActive}) => isActive ? "font-medium text-white" : "text-white hover:opacity-80"}>Pedidos</NavLink>
           {user && (
             <div className="flex items-center gap-2">
               <OrderNotifications />
               <NotificationCenter />
             </div>
           )}
          {!user ? (
            <NavLink to="/entrar" className={({isActive}) => isActive ? "font-medium text-[hsl(var(--foreground))]" : "text-[hsl(var(--foreground))] hover:opacity-80"}>{t("nav.login")}</NavLink>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger className="outline-none">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{user.email?.[0]?.toUpperCase() ?? "U"}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover text-foreground z-[60]">
                <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/seller-dashboard">Painel do Vendedor</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/mensagens">Mensagens</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/creditos">{t("credits.nav")}</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>Sair</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <ShoppingCartButton />
          <LanguageSwitcher />
          <Link to="/publicar">
            <Button variant="hero" size="sm">{t("nav.publish")}</Button>
          </Link>
        </div>
      </nav>
      <div className="container md:hidden pb-3 space-y-2 text-white">
        <SearchBar />
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 overflow-x-auto text-sm">
            <NavLink to="/explorar" className={({isActive}) => isActive ? "font-medium text-white" : "text-white hover:opacity-80 whitespace-nowrap"}>{t("nav.explore")}</NavLink>
            {user ? (
              <MobileMenuDropdown user={user} />
            ) : (
              <NavLink to="/entrar" className={({isActive}) => isActive ? "font-medium text-white" : "text-white hover:opacity-80 whitespace-nowrap"}>{t("nav.login")}</NavLink>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link to="/publicar">
              <Button variant="hero" size="sm">{t("nav.publish_short")}</Button>
            </Link>
          </div>
        </div>
      </div>
      <FeaturedListingsBar />
    </header>
  );
};

export default Header;
