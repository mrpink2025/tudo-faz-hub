import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCategories } from "@/hooks/useCategories";
import { useListings } from "@/hooks/useListings";
import { ListingCard } from "@/components/listings/ListingCard";
import PromoCTA from "@/components/PromoCTA";
import FeaturedListingsSection from "@/components/listings/FeaturedListingsSection";
import { useTranslation } from "react-i18next";
import { AdvancedSearch } from "@/components/AdvancedSearch";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { ListingGridSkeleton } from "@/components/ui/loading-skeletons";
import { SmartPagination, PaginationInfo, PageSizeSelect } from "@/components/ui/smart-pagination";

const Explore = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const selectedSlug = searchParams.get("categoria") ?? undefined;
  const searchQuery = searchParams.get("q") ?? undefined;
  const { data: categories, isLoading: loadingCats, error: catsError } = useCategories();
  const { t, i18n } = useTranslation();
  
  // Função para obter nome da categoria no idioma atual
  const getCategoryName = (category: any) => {
    const lang = (i18n.language || "pt").split("-")[0];
    
    // Traduções estáticas para categorias principais
    const staticTranslations: Record<string, Record<string, string>> = {
      'empregos': {
        'en': 'Jobs',
        'es': 'Empleos', 
        'zh': '工作',
        'pt': 'Empregos'
      },
      'imoveis': {
        'en': 'Real Estate',
        'es': 'Bienes Raíces',
        'zh': '房地产',
        'pt': 'Imóveis'
      },
      'servicos': {
        'en': 'Services',
        'es': 'Servicios',
        'zh': '服务',
        'pt': 'Serviços'
      },
      'veiculos': {
        'en': 'Vehicles',
        'es': 'Vehículos',
        'zh': '车辆',
        'pt': 'Veículos'
      },
      'vida-cotidiana': {
        'en': 'Daily Life',
        'es': 'Vida Cotidiana',
        'zh': '日常生活',
        'pt': 'Vida Cotidiana'
      },
      'servicos-financeiros': {
        'en': 'Financial Services',
        'es': 'Servicios Financieros',
        'zh': '金融服务',
        'pt': 'Serviços Financeiros'
      },
      'eletronicos': {
        'en': 'Electronics',
        'es': 'Electrónicos',
        'zh': '电子产品',
        'pt': 'Eletrônicos'
      },
      'outros': {
        'en': 'Others',
        'es': 'Otros',
        'zh': '其他',
        'pt': 'Outros'
      }
    };

    // Primeiro tenta usar tradução estática baseada no slug
    const slug = category.slug?.toLowerCase();
    if (staticTranslations[slug] && staticTranslations[slug][lang]) {
      return staticTranslations[slug][lang];
    }

    // Depois tenta usar campos do banco de dados
    switch (lang) {
      case 'en':
        return category.name_en || category.name_pt;
      case 'es':
        return category.name_es || category.name_pt;
      case 'zh':
        return category.name_zh || category.name_pt;
      default:
        return category.name_pt;
    }
  };
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1', 10));
  const [pageSize, setPageSize] = useState(parseInt(searchParams.get('pageSize') || '20', 10));

  const { selectedCategory, rootCategory, subcategories } = useMemo(() => {
    const list = categories ?? [];
    const selected = list.find((c: any) => c.slug === selectedSlug);
    const root = selected?.parent_id
      ? list.find((c: any) => c.id === selected.parent_id)
      : selected;
    const subs = root ? list.filter((c: any) => c.parent_id === root.id) : [];
    return { selectedCategory: selected, rootCategory: root, subcategories: subs };
  }, [categories, selectedSlug]);

  const { data: listings = [], isLoading: loadingListings, totalCount } = useListings(
    { 
      categorySlug: rootCategory?.slug || selectedSlug,
      search: searchQuery,
      pageSize
    },
    categories
  );

  const totalPages = Math.ceil((totalCount || 0) / pageSize);

  const updateUrl = (page: number, newPageSize?: number) => {
    const newParams = new URLSearchParams(searchParams);
    
    if (page === 1) {
      newParams.delete('page');
    } else {
      newParams.set('page', String(page));
    }
    
    if (newPageSize && newPageSize !== 20) {
      newParams.set('pageSize', String(newPageSize));
    } else if (!newPageSize) {
      // Keep existing pageSize
      if (pageSize !== 20) {
        newParams.set('pageSize', String(pageSize));
      }
    }
    
    setSearchParams(newParams);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateUrl(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
    updateUrl(1, size);
  };

  useEffect(() => {
    const categoryName = rootCategory ? getCategoryName(rootCategory) : null;
    const title = rootCategory
      ? t("explore.titleCat", { name: categoryName })
      : t("explore.titleBase");
    document.title = `${title} - tudofaz.com`;

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute(
      "content",
      rootCategory
        ? t("explore.descCat", { name: categoryName })
        : t("explore.descBase")
    );

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", window.location.href);
  }, [rootCategory, t, i18n.language]);

  return (
    <main className="container py-10">
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl">
              {searchQuery ? t("explore_page.results_for", { query: searchQuery }) : 
               rootCategory ? t("explore.headerCat", { name: getCategoryName(rootCategory) }) : 
               t("explore.headerBase")}
            </h1>
            <p className="text-muted-foreground">
              {searchQuery ? t("explore_page.results_found", { count: totalCount || 0 }) : t("explore.useSearch")}
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
            className="gap-2"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {t("ui.filters")}
          </Button>
        </div>
        
        {showAdvancedSearch && (
          <div className="mt-6">
            <AdvancedSearch />
          </div>
        )}
      </header>

      {loadingCats && (
        <div className="text-muted-foreground">{t("explore.loadingCats")}</div>
      )}
      {catsError && (
        <div className="text-destructive">{t("explore.errorCats")}</div>
      )}

      <section className="mb-8">
        <FeaturedListingsSection title={t("explore_page.featured_listings")} limit={3} />
      </section>

      <section className="mb-8">
        <PromoCTA />
      </section>

      {rootCategory && subcategories.length > 0 && (
        <section aria-label="Subcategorias" className="mb-8">
          <h2 className="font-display text-xl mb-3">{t("explore.subcategories")}</h2>
          <nav className="flex flex-wrap gap-2">
            {subcategories.map((sc: any) => (
              <Link
                key={sc.id}
                to={`/explorar?categoria=${sc.slug}`}
                className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                aria-label={`${t("explore.ariaExplore")} ${getCategoryName(sc)}`}
              >
                {getCategoryName(sc)}
              </Link>
            ))}
          </nav>
        </section>
      )}

      <section aria-label="Resultados">
        {/* Top pagination controls */}
        {!loadingListings && totalCount > 0 && (
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <PaginationInfo
              currentPage={currentPage}
              pageSize={pageSize}
              totalCount={totalCount}
            />
            <PageSizeSelect
              pageSize={pageSize}
              options={[10, 20, 30, 50]}
              onPageSizeChange={handlePageSizeChange}
            />
          </div>
        )}

        {loadingListings ? (
          <ListingGridSkeleton count={pageSize} />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
              {listings.map((l: any) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
            
            {/* Bottom pagination controls */}
            {totalCount > 0 && totalPages > 1 && (
              <div className="flex flex-col items-center gap-4">
                <SmartPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  siblingCount={1}
                />
                <PaginationInfo
                  currentPage={currentPage}
                  pageSize={pageSize}
                  totalCount={totalCount}
                />
              </div>
            )}
          </>
        )}
        
        {!loadingListings && listings.length === 0 && (
          <div className="rounded-lg border p-6 text-muted-foreground mt-4">
            {t("explore.noneFound")}
          </div>
        )}
      </section>
    </main>
  );
};

export default Explore;
