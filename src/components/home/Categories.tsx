
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

const Categories = () => {
  const { t } = useTranslation();
  const { data: categories, isLoading, error } = useCategories();

  if (isLoading) {
    return (
      <section className="py-10 lg:py-14">
        <div className="container">
          <h2 className="font-display text-2xl mb-6">{t('categories.title')}</h2>
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
          <h2 className="font-display text-2xl mb-6">{t('categories.title')}</h2>
          <div className="text-center text-muted-foreground">
            Erro ao carregar categorias. Tente novamente mais tarde.
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
        <h2 className="font-display text-2xl mb-6">{t('categories.title')}</h2>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {mainCategories.map((category) => {
            const Icon = iconMap[category.slug] || Package;
            return (
              <Link key={category.id} to={`/explorar?categoria=${category.slug}`} aria-label={`Explorar ${category.name_pt}`}>
                <Card className="hover:shadow-md transition-shadow group">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] group-hover:bg-[hsl(var(--muted))] transition-colors">
                        <Icon className="" />
                      </span>
                      {category.name_pt}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-muted-foreground">
                    Ver anúncios de {category.name_pt.toLowerCase()}
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
