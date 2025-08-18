import { Link } from "react-router-dom";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { useCategories } from "@/hooks/useCategories";
import { useState } from "react";
import { useTranslation } from "react-i18next";

const CategoryMenu = () => {
  const { data: categories, isLoading, error } = useCategories();
  const { t, i18n } = useTranslation();
  const cats = (categories as any[]) ?? [];
  const roots = cats.filter((c) => !c.parent_id);
  const getChildren = (id: string) => cats.filter((c) => c.parent_id === id);

  const labelFor = (cat: any) => {
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
    const slug = cat.slug?.toLowerCase();
    if (staticTranslations[slug] && staticTranslations[slug][lang]) {
      return staticTranslations[slug][lang];
    }

    // Depois tenta usar campos do banco de dados
    switch (lang) {
      case 'en':
        return cat.name_en || cat.name_pt || cat.slug;
      case 'es':
        return cat.name_es || cat.name_pt || cat.slug;
      case 'zh':
        return cat.name_zh || cat.name_pt || cat.slug;
      default:
        return cat.name_pt || cat.slug;
    }
  };

  const [active, setActive] = useState<string | null>(null);
  const highlightedId = active ?? roots[0]?.id;
  const currentRoot = roots.find((r: any) => r.id === highlightedId);


  return (
    <NavigationMenu className="z-50">
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="min-w-[140px] text-[hsl(var(--foreground))] hover:bg-white/10">{t("categories.menu")}</NavigationMenuTrigger>
          <NavigationMenuContent className="p-4 bg-popover text-foreground border border-border rounded-md shadow-lg">
            {isLoading && (
              <div className="px-2 py-1.5 text-sm">{t("common.loading")}</div>
            )}
            {error && (
              <div className="px-2 py-1.5 text-sm text-destructive">
                {t("categories.error")}
              </div>
            )}
            {!isLoading && !error && roots.length > 0 && (
              <div className="w-[min(90vw,900px)] grid grid-cols-1 sm:grid-cols-3 gap-6">
                <aside className="sm:col-span-1 max-h-[360px] overflow-y-auto pr-2 border-r border-border">
                  <ul className="space-y-1">
                    {roots.map((root: any) => {
                      const isActive = highlightedId === root.id;
                      return (
                        <li key={root.id}>
                          <button
                            type="button"
                            onMouseEnter={() => setActive(root.id)}
                            onFocus={() => setActive(root.id)}
                            className={`w-full text-left px-3 py-2 rounded-md transition-colors ${isActive ? "bg-muted text-foreground" : "hover:bg-muted/60"}`}
                            aria-haspopup="menu"
                            aria-expanded={isActive}
                          >
                            <span className="truncate">{labelFor(root)}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </aside>
                <section className="sm:col-span-2">
                  {currentRoot ? (
                    <>
                      <div className="mb-3">
                        <Link
                          to={`/explorar?categoria=${encodeURIComponent(currentRoot.slug)}`}
                          className="text-sm underline hover:text-primary transition-colors"
                        >
                          {t("categories.view_all", { name: labelFor(currentRoot) })}
                        </Link>
                      </div>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {getChildren(currentRoot.id).length === 0 && (
                          <li className="text-sm text-muted-foreground">{t("categories.no_children")}</li>
                        )}
                        {getChildren(currentRoot.id).map((child: any) => (
                          <li key={child.id}>
                            <Link
                              to={`/explorar?categoria=${encodeURIComponent(child.slug)}`}
                              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {labelFor(child)}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground">{t("categories.none")}</div>
                  )}
                </section>
              </div>
            )}
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
};

export default CategoryMenu;
