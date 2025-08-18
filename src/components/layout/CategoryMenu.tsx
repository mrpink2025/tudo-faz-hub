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
    
    // Traduções estáticas para categorias principais e subcategorias
    const staticTranslations: Record<string, Record<string, string>> = {
      // Categorias principais
      'veiculos': {
        'en': 'Vehicles & Transportation',
        'es': 'Vehículos y Transporte', 
        'zh': '车辆与交通',
        'pt': 'Veículos e Transportes'
      },
      'imoveis': {
        'en': 'Real Estate',
        'es': 'Bienes Raíces',
        'zh': '房地产',
        'pt': 'Imóveis'
      },
      'empregos': {
        'en': 'Jobs & Careers',
        'es': 'Empleos y Carreras',
        'zh': '工作与职业',
        'pt': 'Empregos e Carreiras'
      },
      'eletronicos': {
        'en': 'Electronics & Technology',
        'es': 'Electrónicos y Tecnología',
        'zh': '电子产品与技术',
        'pt': 'Eletrônicos e Tecnologia'
      },
      'casa-decoracao': {
        'en': 'Home & Decoration',
        'es': 'Casa y Decoración',
        'zh': '家居与装饰',
        'pt': 'Casa e Decoração'
      },
      'moda-beleza': {
        'en': 'Fashion & Beauty',
        'es': 'Moda y Belleza',
        'zh': '时尚与美容',
        'pt': 'Moda e Beleza'
      },
      'esportes-lazer': {
        'en': 'Sports & Leisure',
        'es': 'Deportes y Ocio',
        'zh': '体育与休闲',
        'pt': 'Esportes e Lazer'
      },
      'servicos': {
        'en': 'Services',
        'es': 'Servicios',
        'zh': '服务',
        'pt': 'Serviços'
      },
      'animais-pets': {
        'en': 'Animals & Pets',
        'es': 'Animales y Mascotas',
        'zh': '动物与宠物',
        'pt': 'Animais e Pets'
      },
      'outros': {
        'en': 'Others',
        'es': 'Otros',
        'zh': '其他',
        'pt': 'Outros'
      },
      // Subcategorias de Veículos
      'carros': {
        'en': 'Cars',
        'es': 'Coches',
        'zh': '汽车',
        'pt': 'Carros'
      },
      'motos': {
        'en': 'Motorcycles & Scooters',
        'es': 'Motos y Scooters',
        'zh': '摩托车与踏板车',
        'pt': 'Motos e Scooters'
      },
      'caminhoes': {
        'en': 'Trucks & Commercial',
        'es': 'Camiones y Comerciales',
        'zh': '卡车与商用车',
        'pt': 'Caminhões e Comerciais'
      },
      'barcos': {
        'en': 'Boats & Nautical',
        'es': 'Barcos y Náutica',
        'zh': '船只与航海',
        'pt': 'Barcos e Náutica'
      },
      'bicicletas': {
        'en': 'Bicycles',
        'es': 'Bicicletas',
        'zh': '自行车',
        'pt': 'Bicicletas'
      },
      'pecas-auto': {
        'en': 'Parts & Accessories',
        'es': 'Piezas y Accesorios',
        'zh': '配件与零件',
        'pt': 'Peças e Acessórios'
      },
      // Subcategorias de Imóveis
      'apartamentos-venda': {
        'en': 'Apartments for Sale',
        'es': 'Apartamentos en Venta',
        'zh': '出售公寓',
        'pt': 'Apartamentos à Venda'
      },
      'casas-venda': {
        'en': 'Houses for Sale',
        'es': 'Casas en Venta',
        'zh': '出售房屋',
        'pt': 'Casas à Venda'
      },
      'apartamentos-aluguel': {
        'en': 'Apartments for Rent',
        'es': 'Apartamentos en Alquiler',
        'zh': '出租公寓',
        'pt': 'Apartamentos para Alugar'
      },
      'casas-aluguel': {
        'en': 'Houses for Rent',
        'es': 'Casas en Alquiler',
        'zh': '出租房屋',
        'pt': 'Casas para Alugar'
      },
      'terrenos': {
        'en': 'Land & Lots',
        'es': 'Terrenos y Lotes',
        'zh': '土地与地块',
        'pt': 'Terrenos e Lotes'
      },
      'comerciais': {
        'en': 'Commercial Properties',
        'es': 'Propiedades Comerciales',
        'zh': '商业地产',
        'pt': 'Imóveis Comerciais'
      },
      // Subcategorias de Empregos
      'tempo-integral': {
        'en': 'Full Time',
        'es': 'Tiempo Completo',
        'zh': '全职',
        'pt': 'Tempo Integral'
      },
      'meio-periodo': {
        'en': 'Part Time',
        'es': 'Medio Tiempo',
        'zh': '兼职',
        'pt': 'Meio Período'
      },
      'freelancer': {
        'en': 'Freelancer',
        'es': 'Freelancer',
        'zh': '自由职业',
        'pt': 'Freelancer'
      },
      'tecnologia': {
        'en': 'Technology & IT',
        'es': 'Tecnología y TI',
        'zh': '技术与IT',
        'pt': 'Tecnologia e TI'
      },
      'vendas': {
        'en': 'Sales & Commerce',
        'es': 'Ventas y Comercio',
        'zh': '销售与商业',
        'pt': 'Vendas e Comércio'
      },
      // Subcategorias de Eletrônicos
      'celulares': {
        'en': 'Phones & Smartphones',
        'es': 'Teléfonos y Smartphones',
        'zh': '手机与智能手机',
        'pt': 'Celulares e Smartphones'
      },
      'computadores': {
        'en': 'Computers & Laptops',
        'es': 'Computadoras y Laptops',
        'zh': '电脑与笔记本',
        'pt': 'Computadores e Notebooks'
      },
      'tvs': {
        'en': 'TVs & Home Theater',
        'es': 'TVs y Home Theater',
        'zh': '电视与家庭影院',
        'pt': 'TVs e Home Theater'
      }
    };

    // Primeiro tenta usar tradução estática baseada no slug
    const slug = cat.slug?.toLowerCase();
    if (staticTranslations[slug] && staticTranslations[slug][lang]) {
      return staticTranslations[slug][lang];
    }

    // Depois tenta usar campos do banco de dados
    return cat.name_pt || cat.slug;
  };

  const [active, setActive] = useState<string | null>(null);
  const highlightedId = active ?? roots[0]?.id;
  const currentRoot = roots.find((r: any) => r.id === highlightedId);


  return (
    <NavigationMenu className="z-50 relative">
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="min-w-[140px] text-foreground bg-background hover:bg-accent hover:text-accent-foreground border border-border">{t("categories.menu")}</NavigationMenuTrigger>
          <NavigationMenuContent className="p-4 bg-popover text-popover-foreground border border-border rounded-md shadow-lg z-50 relative">
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
                <aside className="sm:col-span-1 max-h-[360px] overflow-y-auto pr-2 border-r border-border/50">
                  <ul className="space-y-1">
                    {roots.map((root: any) => {
                      const isActive = highlightedId === root.id;
                      return (
                        <li key={root.id}>
                          <button
                            type="button"
                            onMouseEnter={() => setActive(root.id)}
                            onFocus={() => setActive(root.id)}
                            className={`w-full text-left px-3 py-2 rounded-md transition-colors ${isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent/60 text-muted-foreground hover:text-foreground"}`}
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
