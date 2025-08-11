import { Link, NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Header = () => {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
      <nav className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-display text-xl tracking-tight">tudofaz</span>
        </Link>
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
