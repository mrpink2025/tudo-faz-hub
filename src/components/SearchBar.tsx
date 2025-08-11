import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useState } from "react";

const SearchBar = () => {
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/explorar?q=${encodeURIComponent(q)}`);
  };
  return (
    <form onSubmit={onSubmit} className="w-full max-w-xl mx-auto flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-10"
          placeholder="Busque por produtos, serviços, imóveis, empregos..."
          aria-label="Buscar no tudofaz"
        />
      </div>
      <Button type="submit" variant="hero">Buscar</Button>
    </form>
  );
};

export default SearchBar;
