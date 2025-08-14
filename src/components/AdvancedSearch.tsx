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
          Busca Avançada
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="search-term">Termo de busca</Label>
            <Input
              id="search-term"
              placeholder="Digite o que procura..."
              value={filters.q}
              onChange={(e) => setFilters(prev => ({ ...prev, q: e.target.value }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as categorias</SelectItem>
                {parentCategories.map((category) => (
                  <SelectItem key={category.id} value={category.slug}>
                    {category.name_pt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="min-price">Preço mínimo</Label>
            <Input
              id="min-price"
              type="number"
              placeholder="0"
              value={filters.minPrice}
              onChange={(e) => setFilters(prev => ({ ...prev, minPrice: e.target.value }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="max-price">Preço máximo</Label>
            <Input
              id="max-price"
              type="number"
              placeholder="999999"
              value={filters.maxPrice}
              onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location">Localização</Label>
            <Input
              id="location"
              placeholder="Cidade, estado..."
              value={filters.location}
              onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="currency">Moeda</Label>
            <Select value={filters.currency} onValueChange={(value) => setFilters(prev => ({ ...prev, currency: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BRL">Real (R$)</SelectItem>
                <SelectItem value="USD">Dólar ($)</SelectItem>
                <SelectItem value="EUR">Euro (€)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Button onClick={handleSearch} className="w-full" variant="hero">
          <Search className="w-4 h-4 mr-2" />
          Buscar
        </Button>
      </CardContent>
    </Card>
  );
};