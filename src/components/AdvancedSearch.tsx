import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, SlidersHorizontal } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import { useTranslation } from "react-i18next";

export const AdvancedSearch = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: categories = [] } = useCategories();
  
  const [filters, setFilters] = useState({
    q: searchParams.get('q') || '',
    category: searchParams.get('categoria') || '',
    minPrice: searchParams.get('precoMin') || '',
    maxPrice: searchParams.get('precoMax') || '',
    location: searchParams.get('local') || '',
    currency: searchParams.get('moeda') || 'BRL'
  });

  const handleSearch = () => {
    const params = new URLSearchParams();
    
    if (filters.q) params.set('q', filters.q);
    if (filters.category) params.set('categoria', filters.category);
    if (filters.minPrice) params.set('precoMin', filters.minPrice);
    if (filters.maxPrice) params.set('precoMax', filters.maxPrice);
    if (filters.location) params.set('local', filters.location);
    if (filters.currency !== 'BRL') params.set('moeda', filters.currency);

    navigate(`/explorar?${params.toString()}`);
  };

  const parentCategories = categories.filter(cat => !cat.parent_id);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5" />
          {t("search.advanced")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="search-term">{t("search.term")}</Label>
            <Input
              id="search-term"
              placeholder={t("search.term_placeholder")}
              value={filters.q}
              onChange={(e) => setFilters(prev => ({ ...prev, q: e.target.value }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">{t("search.category")}</Label>
            <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
              <SelectTrigger>
                <SelectValue placeholder={t("search.all_categories")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t("search.all_categories")}</SelectItem>
                {parentCategories.map((category) => (
                  <SelectItem key={category.id} value={category.slug}>
                    {category.name_pt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="min-price">{t("search.min_price")}</Label>
            <Input
              id="min-price"
              type="number"
              placeholder="0"
              value={filters.minPrice}
              onChange={(e) => setFilters(prev => ({ ...prev, minPrice: e.target.value }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="max-price">{t("search.max_price")}</Label>
            <Input
              id="max-price"
              type="number"
              placeholder="999999"
              value={filters.maxPrice}
              onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location">{t("search.location")}</Label>
            <Input
              id="location"
              placeholder={t("search.location_placeholder")}
              value={filters.location}
              onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="currency">{t("search.currency")}</Label>
            <Select value={filters.currency} onValueChange={(value) => setFilters(prev => ({ ...prev, currency: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BRL">{t("currency.brl")}</SelectItem>
                <SelectItem value="USD">{t("currency.usd")}</SelectItem>
                <SelectItem value="EUR">{t("currency.eur")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Button onClick={handleSearch} className="w-full" variant="hero">
          <Search className="w-4 h-4 mr-2" />
          {t("search.search_button")}
        </Button>
      </CardContent>
    </Card>
  );
};