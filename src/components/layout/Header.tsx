import { Link, NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import SearchBar from "@/components/SearchBar";
import CategoryMenu from "./CategoryMenu";

const Header = () => {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
      <nav className="container flex h-16 items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-display text-xl tracking-tight">tudofaz</span>
          </Link>
          <div className="hidden md:block">
            <CategoryMenu />
          </div>
        </div>

        <div className="flex-1 hidden md:block">
          <SearchBar />
        </div>

        <div className="hidden md:flex items-center gap-6 text-sm">
          <NavLink to="/explorar" className={({isActive}) => isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"}>Explorar</NavLink>
          <NavLink to="/mensagens" className={({isActive}) => isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"}>Mensagens</NavLink>
          <NavLink to="/entrar" className={({isActive}) => isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"}>Entrar</NavLink>
          <Link to="/publicar">
            <Button variant="hero" size="sm">Publicar anúncio</Button>
          </Link>
        </div>
      </nav>
    </header>
  );
};

export default Header;
