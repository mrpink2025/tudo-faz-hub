import { useNavigate, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useValidation } from "@/hooks/useValidation";
import { searchSchema } from "@/lib/validationSchemas";
import { useSearch } from "@/contexts/SearchContext";

const SearchBar = () => {
  const { t } = useTranslation();
  const { validate } = useValidation();
  const [searchParams] = useSearchParams();
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const { setCurrentSearchValue } = useSearch();
  
  // Sync with URL params on mount
  useEffect(() => {
    const urlQuery = searchParams.get('q') || '';
    setQ(urlQuery);
    setCurrentSearchValue(urlQuery);
  }, [searchParams, setCurrentSearchValue]);
  
  // Update context when local state changes
  const handleInputChange = (value: string) => {
    setQ(value);
    setCurrentSearchValue(value);
  };
  
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
          onChange={(e) => handleInputChange(e.target.value)}
          className="pl-10 h-11 text-foreground caret-foreground"
          placeholder={t("search.search_placeholder")}
          aria-label={t("search.search_aria")}
        />
      </div>
    </form>
  );
};

export default SearchBar;
