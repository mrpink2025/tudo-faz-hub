import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Search, X, MapPin, Calendar, DollarSign, Star, Filter } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCategories } from "@/hooks/useCategories";
import { logger } from "@/utils/logger";

interface AdvancedFilters {
  searchTerm: string;
  category: string;
  priceRange: [number, number];
  location: string;
  radius: number;
  dateRange: {
    from: string;
    to: string;
  };
  sortBy: 'recent' | 'price_low' | 'price_high' | 'distance';
  onlyWithImages: boolean;
  onlyHighlighted: boolean;
}

interface AdvancedSearchProps {
  onFiltersChange: (filters: AdvancedFilters) => void;
  initialFilters?: Partial<AdvancedFilters>;
  isOpen?: boolean;
  onToggle?: () => void;
}

const defaultFilters: AdvancedFilters = {
  searchTerm: "",
  category: "",
  priceRange: [0, 10000],
  location: "",
  radius: 25,
  dateRange: { from: "", to: "" },
  sortBy: 'recent',
  onlyWithImages: false,
  onlyHighlighted: false,
};

export function AdvancedSearchFilters({ 
  onFiltersChange, 
  initialFilters = {}, 
  isOpen = false,
  onToggle 
}: AdvancedSearchProps) {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: categories = [] } = useCategories();
  
  const [filters, setFilters] = useState<AdvancedFilters>({
    ...defaultFilters,
    ...initialFilters
  });

  const [savedFilters, setSavedFilters] = useState<AdvancedFilters[]>([]);

  // Load saved filters from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('tudofaz-saved-filters');
      if (saved) {
        setSavedFilters(JSON.parse(saved));
      }
    } catch (error) {
      logger.error('Error loading saved filters', { error });
    }
  }, []);

  // Apply URL params to filters
  useEffect(() => {
    const urlFilters: Partial<AdvancedFilters> = {};
    
    const searchTerm = searchParams.get('q');
    if (searchTerm) urlFilters.searchTerm = searchTerm;
    
    const category = searchParams.get('categoria');
    if (category) urlFilters.category = category;
    
    const location = searchParams.get('local');
    if (location) urlFilters.location = location;
    
    const sortBy = searchParams.get('ordem') as AdvancedFilters['sortBy'];
    if (sortBy) urlFilters.sortBy = sortBy;

    setFilters(prev => ({ ...prev, ...urlFilters }));
  }, [searchParams]);

  const updateFilters = (newFilters: Partial<AdvancedFilters>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    onFiltersChange(updated);
    
    // Update URL params
    const params = new URLSearchParams(searchParams);
    
    if (updated.searchTerm) {
      params.set('q', updated.searchTerm);
    } else {
      params.delete('q');
    }
    
    if (updated.category) {
      params.set('categoria', updated.category);
    } else {
      params.delete('categoria');
    }
    
    if (updated.location) {
      params.set('local', updated.location);
    } else {
      params.delete('local');
    }
    
    if (updated.sortBy !== 'recent') {
      params.set('ordem', updated.sortBy);
    } else {
      params.delete('ordem');
    }
    
    setSearchParams(params);
    logger.info('Filters updated', { filters: updated });
  };

  const clearFilters = () => {
    const cleared = { ...defaultFilters };
    setFilters(cleared);
    onFiltersChange(cleared);
    setSearchParams(new URLSearchParams());
    logger.info('Filters cleared');
  };

  const saveCurrentFilters = () => {
    const filterName = prompt(t('search.save_filter_name'));
    if (filterName) {
      const namedFilter = { ...filters, name: filterName };
      const updated = [...savedFilters, namedFilter];
      setSavedFilters(updated);
      localStorage.setItem('tudofaz-saved-filters', JSON.stringify(updated));
      logger.info('Filter saved', { name: filterName });
    }
  };

  const loadSavedFilter = (savedFilter: AdvancedFilters) => {
    updateFilters(savedFilter);
  };

  const deleteSavedFilter = (index: number) => {
    const updated = savedFilters.filter((_, i) => i !== index);
    setSavedFilters(updated);
    localStorage.setItem('tudofaz-saved-filters', JSON.stringify(updated));
  };

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'searchTerm') return value.trim() !== '';
    if (key === 'category') return value !== '';
    if (key === 'location') return value !== '';
    if (key === 'priceRange') return value[0] !== 0 || value[1] !== 10000;
    if (key === 'radius') return value !== 25;
    if (key === 'dateRange') return value.from !== '' || value.to !== '';
    if (key === 'sortBy') return value !== 'recent';
    return value === true;
  }).length;

  return (
    <Card className="mb-6">
      <Collapsible open={isOpen} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                <span>{t('search.advanced_filters')}</span>
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary">{activeFiltersCount}</Badge>
                )}
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Search Term */}
            <div className="space-y-2">
              <Label htmlFor="search-term" className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                {t('search.search_term')}
              </Label>
              <Input
                id="search-term"
                placeholder={t('search.search_placeholder')}
                value={filters.searchTerm}
                onChange={(e) => updateFilters({ searchTerm: e.target.value })}
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>{t('search.category')}</Label>
              <Select 
                value={filters.category || "all"} 
                onValueChange={(value) => updateFilters({ category: value === "all" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('search.select_category')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('search.all_categories')}</SelectItem>
                  {categories.map((cat: any) => (
                    <SelectItem key={cat.id} value={cat.slug}>
                      {cat.name_pt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Price Range */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                {t('search.price_range')}: R$ {filters.priceRange[0]} - R$ {filters.priceRange[1]}
              </Label>
              <Slider
                value={filters.priceRange}
                onValueChange={(value) => updateFilters({ priceRange: value as [number, number] })}
                max={10000}
                min={0}
                step={100}
                className="w-full"
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {t('search.location')}
              </Label>
              <Input
                id="location"
                placeholder={t('search.location_placeholder')}
                value={filters.location}
                onChange={(e) => updateFilters({ location: e.target.value })}
              />
            </div>

            {/* Search Radius */}
            <div className="space-y-2">
              <Label>{t('search.search_radius')}: {filters.radius} km</Label>
              <Slider
                value={[filters.radius]}
                onValueChange={(value) => updateFilters({ radius: value[0] })}
                max={100}
                min={1}
                step={1}
                className="w-full"
              />
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date-from" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {t('search.date_from')}
                </Label>
                <Input
                  id="date-from"
                  type="date"
                  value={filters.dateRange.from}
                  onChange={(e) => updateFilters({ 
                    dateRange: { ...filters.dateRange, from: e.target.value }
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date-to">{t('search.date_to')}</Label>
                <Input
                  id="date-to"
                  type="date"
                  value={filters.dateRange.to}
                  onChange={(e) => updateFilters({ 
                    dateRange: { ...filters.dateRange, to: e.target.value }
                  })}
                />
              </div>
            </div>

            {/* Sort By */}
            <div className="space-y-2">
              <Label>{t('search.sort_by')}</Label>
              <Select 
                value={filters.sortBy} 
                onValueChange={(value: AdvancedFilters['sortBy']) => updateFilters({ sortBy: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="recent">{t('search.sort_recent')}</SelectItem>
                  <SelectItem value="price_low">{t('search.sort_price_low')}</SelectItem>
                  <SelectItem value="price_high">{t('search.sort_price_high')}</SelectItem>
                  <SelectItem value="distance">{t('search.sort_distance')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Toggles */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="only-images">{t('search.only_with_images')}</Label>
                <Switch
                  id="only-images"
                  checked={filters.onlyWithImages}
                  onCheckedChange={(checked) => updateFilters({ onlyWithImages: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="only-highlighted" className="flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  {t('search.only_highlighted')}
                </Label>
                <Switch
                  id="only-highlighted"
                  checked={filters.onlyHighlighted}
                  onCheckedChange={(checked) => updateFilters({ onlyHighlighted: checked })}
                />
              </div>
            </div>

            {/* Saved Filters */}
            {savedFilters.length > 0 && (
              <div className="space-y-2">
                <Label>{t('search.saved_filters')}</Label>
                <div className="flex flex-wrap gap-2">
                  {savedFilters.map((savedFilter: any, index) => (
                    <div key={index} className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadSavedFilter(savedFilter)}
                      >
                        {savedFilter.name}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteSavedFilter(index)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t">
              <Button onClick={saveCurrentFilters} variant="outline" size="sm">
                {t('search.save_filter')}
              </Button>
              <Button onClick={clearFilters} variant="outline" size="sm">
                {t('search.clear_filters')}
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}