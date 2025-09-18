/**
 * ============================================================================
 * 🧭 TUDOFAZ HUB - HEADER NAVIGATION COMPONENT
 * ============================================================================
 * 
 * Main navigation header with responsive design and dynamic user state
 * Handles authentication, search, categories, and mobile navigation
 * 
 * @author by_arturalves
 * @component Header
 * @version 1.0.0
 * @year 2025
 * 
 * Features:
 * - 🔍 Global search integration
 * - 📱 Mobile-responsive navigation
 * - 👤 Dynamic user authentication state
 * - 🎨 Category dropdown menu
 * - 🔔 Notification center integration
 * - 🌐 Language switching support
 * - 🎯 Admin panel access for authorized users
 * 
 * ============================================================================
 */

import { Link, NavLink, useSearchParams, useNavigate } from "react-router-dom";
import { User, Settings, Shield, MessageCircle, DollarSign, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import SearchBar from "@/components/SearchBar";
import CategoryMenu from "./CategoryMenu";
import MobileMenu from "./MobileMenu";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
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
import { UnifiedNotifications } from "@/components/notifications/UnifiedNotifications";
import { MobileMenuDropdown } from "./MobileMenuDropdown";
import { ShoppingCartButton } from "@/components/ecommerce/ShoppingCartButton";
import { useSearch } from "@/contexts/SearchContext";
import { useLocation } from "react-router-dom";
import { TranslatedText } from "@/components/ui/translated-text";

const Header = () => {
  const { user } = useSupabaseAuth();
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');
  const { isAdmin } = useIsAdmin();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentSearchValue } = useSearch();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleAdminNavigation = () => {
    window.location.href = '/admin';
  };

  // Create explore link with current search value from input field or URL
  const searchValue = currentSearchValue || searchParams.get('q');
  const exploreLink = searchValue ? `/explorar?q=${encodeURIComponent(searchValue)}` : '/explorar';

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
          <Link to={exploreLink} className="text-white hover:opacity-80">
            <TranslatedText text={t("nav.explore")} className="text-white" as="span" />
          </Link>
          <NavLink to="/mensagens" className={({isActive}) => isActive ? "font-medium text-white" : "text-white hover:opacity-80"}>
            <TranslatedText text={t("nav.messages")} className="text-white" as="span" />
          </NavLink>
          <NavLink to="/afiliados" className={({isActive}) => isActive ? "font-medium text-white" : "text-white hover:opacity-80"}>
            <TranslatedText text={t("nav.affiliates")} className="text-white" as="span" />
          </NavLink>
          <NavLink to="/anunciante" className={({isActive}) => isActive ? "font-medium text-white" : "text-white hover:opacity-80"}>
            <TranslatedText text={t("nav.advertiser")} className="text-white" as="span" />
          </NavLink>
          <NavLink to="/pedidos" className={({isActive}) => isActive ? "font-medium text-white" : "text-white hover:opacity-80"}>
            <TranslatedText text={t("nav.orders")} className="text-white" as="span" />
          </NavLink>
           {user && <UnifiedNotifications />}
          {!user ? (
            <NavLink to="/entrar" className={({isActive}) => isActive ? "font-medium text-[hsl(var(--foreground))]" : "text-[hsl(var(--foreground))] hover:opacity-80"}>{t("nav.login")}</NavLink>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger className="outline-none">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{user.email?.[0]?.toUpperCase() ?? "U"}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background/95 backdrop-blur-sm text-foreground z-[100] w-56 border border-border/50 shadow-lg">
                <DropdownMenuLabel className="px-4 py-2 text-xs text-muted-foreground uppercase tracking-wider">{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {/* Meu Perfil como primeira opção */}
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link to="/perfil" className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent/50 transition-colors">
                    <User className="w-4 h-4 text-primary" />
                    <span className="font-medium">Meu Perfil</span>
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link to="/mensagens" className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent/50 transition-colors">
                    <MessageCircle className="w-4 h-4 text-primary" />
                    <span>{t("nav.messages")}</span>
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link to="/creditos" className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent/50 transition-colors">
                    <DollarSign className="w-4 h-4 text-primary" />
                    <span>{t("credits.nav")}</span>
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link to="/seller-dashboard" className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent/50 transition-colors">
                    <Settings className="w-4 h-4 text-primary" />
                    <span>{t("nav.seller_dashboard")}</span>
                  </Link>
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
            <NavLink to={exploreLink} className={({isActive}) => isActive ? "font-medium text-white" : "text-white hover:opacity-80 whitespace-nowrap"}>{t("nav.explore")}</NavLink>
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
      {!isAdminPage && <FeaturedListingsBar />}
    </header>
  );
};

export default Header;
