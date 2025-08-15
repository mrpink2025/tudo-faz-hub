import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useValidation } from "@/hooks/useValidation";
import { searchSchema } from "@/lib/validationSchemas";

const SearchBar = () => {
  const { t } = useTranslation();
  const { validate } = useValidation();
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validate(searchSchema, { query: q.trim() }, false);
    if (!validation.success) return;
    
    navigate(`/explorar?q=${encodeURIComponent(q.trim())}`);
  };
  return (
    <form onSubmit={onSubmit} className="w-full">
      <div className="relative flex-1 min-w-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-10 h-11"
          placeholder={t("search.search_placeholder")}
          aria-label={t("search.search_aria")}
        />
      </div>
    </form>
  );
};

export default SearchBar;
