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

const Header = () => {
  const { user } = useSupabaseAuth();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-[hsl(var(--brand))] backdrop-blur">
      <nav className="container flex h-16 items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="md:hidden">
            <MobileMenu />
          </div>
          <Link to="/" aria-label="tudofaz - início" className="flex items-center gap-2">
            <Logo className="h-8 w-8" />
          </Link>
          <div className="hidden md:block">
            <CategoryMenu />
          </div>
        </div>

        <div className="flex-1 hidden md:block">
          <SearchBar />
        </div>

        <div className="hidden md:flex items-center gap-6 text-sm">
          <NavLink to="/explorar" className={({isActive}) => isActive ? "font-medium text-[hsl(var(--foreground))]" : "text-[hsl(var(--foreground))] hover:opacity-80"}>Explorar</NavLink>
          <NavLink to="/mensagens" className={({isActive}) => isActive ? "font-medium text-[hsl(var(--foreground))]" : "text-[hsl(var(--foreground))] hover:opacity-80"}>Mensagens</NavLink>
          {!user ? (
            <NavLink to="/entrar" className={({isActive}) => isActive ? "font-medium text-[hsl(var(--foreground))]" : "text-[hsl(var(--foreground))] hover:opacity-80"}>Entrar</NavLink>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger className="outline-none">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{user.email?.[0]?.toUpperCase() ?? "U"}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover text-foreground">
                <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/mensagens">Mensagens</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>Sair</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Link to="/publicar">
            <Button variant="hero" size="sm">Publicar anúncio</Button>
          </Link>
        </div>
      </nav>
      <div className="container md:hidden pb-3 space-y-2 text-[hsl(var(--foreground))]">
        <SearchBar />
        <div className="flex items-center gap-4 overflow-x-auto text-sm">
          <NavLink to="/explorar" className={({isActive}) => isActive ? "font-medium text-[hsl(var(--foreground))]" : "text-[hsl(var(--foreground))] hover:opacity-80"}>Explorar</NavLink>
          {user ? (
            <NavLink to="/mensagens" className={({isActive}) => isActive ? "font-medium text-[hsl(var(--foreground))]" : "text-[hsl(var(--foreground))] hover:opacity-80"}>Mensagens</NavLink>
          ) : (
            <NavLink to="/entrar" className={({isActive}) => isActive ? "font-medium text-[hsl(var(--foreground))]" : "text-[hsl(var(--foreground))] hover:opacity-80"}>Entrar</NavLink>
          )}
          <Link to="/publicar">
            <Button variant="hero" size="sm">Publicar</Button>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
