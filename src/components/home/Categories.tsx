
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Wrench, Home, Car, Smartphone, ShoppingBag, Package, MapPin, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";
import { useCategories } from "@/hooks/useCategories";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";
import { logger } from "@/utils/logger";

// Mapeamento de ícones para as categorias
const iconMap: Record<string, any> = {
  empregos: Briefcase,
  imoveis: Home,
  servicos: Wrench,
  veiculos: Car,
  'vida-cotidiana': ShoppingBag,
  'vida-domestica-e-cotidiana': ShoppingBag,
  'servicos-financeiros': CreditCard,
  compras: ShoppingBag,
  eletronicos: Smartphone,
  outros: Package,
  local: MapPin,
};

// Traduções dinâmicas para categorias
const getCategoryName = (category: any, language: string) => {
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
  if (staticTranslations[slug] && staticTranslations[slug][language]) {
    return staticTranslations[slug][language];
  }

  // Depois tenta usar campos do banco de dados
  switch (language) {
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

const Categories = () => {
  const { t, i18n } = useTranslation();
  const { data: categories, isLoading, error } = useCategories();
  const currentLang = (i18n.language || "pt").split("-")[0];

  if (isLoading) {
    return (
      <section className="py-10 lg:py-14">
        <div className="container">
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-md" />
                    <Skeleton className="h-4 w-20" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    logger.error("Erro ao carregar categorias", { error: error.message });
    return (
      <section className="py-10 lg:py-14">
        <div className="container">
          <div className="text-center text-muted-foreground">
            {t("categories.error_loading")}
          </div>
        </div>
      </section>
    );
  }

  // Filtrar apenas categorias principais (sem parent_id), normalizar e limitar às 6 principais
  const canonical = (slug: string) => {
    if (slug === 'vida-domestica-e-cotidiana') return 'vida-cotidiana';
    return slug;
  };
  const allowed = new Set([
    'empregos',
    'imoveis',
    'servicos',
    'veiculos',
    'vida-cotidiana',
    'servicos-financeiros',
  ]);
  const roots = (categories ?? []).filter((cat) => !cat.parent_id);
  const deduped = Array.from(
    new Map(
      roots.map((c) => [canonical(String(c.slug).trim().toLowerCase()), c])
    ).entries()
  )
    .map(([slug, c]) => ({ ...c, slug }))
    .filter((c) => allowed.has(String(c.slug)));
  const mainCategories = deduped.slice(0, 6);

  return (
    <section className="py-10 lg:py-14">
      <div className="container">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {mainCategories.map((category) => {
            const Icon = iconMap[category.slug] || Package;
            const categoryName = getCategoryName(category, currentLang);
            return (
              <Link key={category.id} to={`/explorar?categoria=${category.slug}`} aria-label={`Explorar ${categoryName}`}>
                <Card className="hover:shadow-md transition-shadow group">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] group-hover:bg-[hsl(var(--muted))] transition-colors">
                        <Icon className="" />
                      </span>
                      {categoryName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-muted-foreground">
                    {t("categories.view_ads", { category: categoryName.toLowerCase() })}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Categories;
