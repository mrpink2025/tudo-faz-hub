
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Wrench, Home, Car, Smartphone, ShoppingBag, Package, MapPin, CreditCard, Sofa, Shirt, Dumbbell, Settings, PawPrint, Camera, Gamepad2, Tv, Monitor, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { useCategories } from "@/hooks/useCategories";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";
import { logger } from "@/utils/logger";

// Mapeamento de ícones para as categorias
const iconMap: Record<string, any> = {
  // Categorias principais
  veiculos: Car,
  imoveis: Home,
  empregos: Briefcase,
  eletronicos: Smartphone,
  'casa-decoracao': Sofa,
  'moda-beleza': Shirt,
  'esportes-lazer': Dumbbell,
  servicos: Settings,
  'animais-pets': PawPrint,
  outros: Package,
  local: MapPin,
  // Subcategorias comuns
  cameras: Camera,
  games: Gamepad2,
  tvs: Tv,
  computadores: Monitor,
  celulares: Phone,
  'pecas-auto': Wrench,
  acessorios: ShoppingBag,
  // Fallback para categorias antigas
  'vida-cotidiana': ShoppingBag,
  'vida-domestica-e-cotidiana': ShoppingBag,
  'servicos-financeiros': CreditCard,
  compras: ShoppingBag
};

// Traduções dinâmicas para categorias
const getCategoryName = (category: any, language: string) => {
  // Traduções estáticas para todas as categorias
  const staticTranslations: Record<string, Record<string, string>> = {
    // Categorias principais
    'veiculos': { 'en': 'Vehicles & Transportation', 'es': 'Vehículos y Transporte', 'zh': '车辆与交通', 'pt': 'Veículos e Transportes' },
    'imoveis': { 'en': 'Real Estate', 'es': 'Bienes Raíces', 'zh': '房地产', 'pt': 'Imóveis' },
    'empregos': { 'en': 'Jobs & Careers', 'es': 'Empleos y Carreras', 'zh': '工作与职业', 'pt': 'Empregos e Carreiras' },
    'eletronicos': { 'en': 'Electronics & Technology', 'es': 'Electrónicos y Tecnología', 'zh': '电子产品与技术', 'pt': 'Eletrônicos e Tecnologia' },
    'casa-decoracao': { 'en': 'Home & Decoration', 'es': 'Casa y Decoración', 'zh': '家居与装饰', 'pt': 'Casa e Decoração' },
    'moda-beleza': { 'en': 'Fashion & Beauty', 'es': 'Moda y Belleza', 'zh': '时尚与美容', 'pt': 'Moda e Beleza' },
    'esportes-lazer': { 'en': 'Sports & Leisure', 'es': 'Deportes y Ocio', 'zh': '体育与休闲', 'pt': 'Esportes e Lazer' },
    'servicos': { 'en': 'Services', 'es': 'Servicios', 'zh': '服务', 'pt': 'Serviços' },
    'animais-pets': { 'en': 'Animals & Pets', 'es': 'Animales y Mascotas', 'zh': '动物与宠物', 'pt': 'Animais e Pets' },
    'outros': { 'en': 'Others', 'es': 'Otros', 'zh': '其他', 'pt': 'Outros' },
    // Para compatibilidade com categorias legadas
    'vida-cotidiana': { 'en': 'Daily Life', 'es': 'Vida Cotidiana', 'zh': '日常生活', 'pt': 'Vida Cotidiana' },
    'servicos-financeiros': { 'en': 'Financial Services', 'es': 'Servicios Financieros', 'zh': '金融服务', 'pt': 'Serviços Financeiros' }
  };

  // Primeiro tenta usar tradução estática baseada no slug
  const slug = category.slug?.toLowerCase();
  if (staticTranslations[slug] && staticTranslations[slug][language]) {
    return staticTranslations[slug][language];
  }

  // Depois tenta usar campos do banco de dados (apenas name_pt disponível)
  return category.name_pt || category.slug;
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
