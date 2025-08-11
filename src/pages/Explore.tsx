import { useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCategories } from "@/hooks/useCategories";

const Explore = () => {
  const [searchParams] = useSearchParams();
  const selectedSlug = searchParams.get("categoria") ?? undefined;
  const { data: categories, isLoading, error } = useCategories();

  const { selectedCategory, rootCategory, subcategories } = useMemo(() => {
    const list = categories ?? [];
    const selected = list.find((c: any) => c.slug === selectedSlug);
    const root = selected?.parent_id
      ? list.find((c: any) => c.id === selected.parent_id)
      : selected;
    const subs = root ? list.filter((c: any) => c.parent_id === root.id) : [];
    return { selectedCategory: selected, rootCategory: root, subcategories: subs };
  }, [categories, selectedSlug]);

  useEffect(() => {
    const title = rootCategory
      ? `Explorar ${rootCategory.name_pt} - tudofaz.com`
      : "Explorar anúncios - tudofaz.com";
    document.title = title;

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute(
      "content",
      rootCategory
        ? `Explore anúncios de ${rootCategory.name_pt} na tudofaz.com`
        : "Explore anúncios e encontre o que precisa na tudofaz.com"
    );

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", window.location.href);
  }, [rootCategory]);

  return (
    <main className="container py-10">
      <header className="mb-6">
        <h1 className="font-display text-3xl">
          {rootCategory ? `Explorar ${rootCategory.name_pt}` : "Explorar anúncios"}
        </h1>
        <p className="text-muted-foreground">
          Use a busca e filtros para encontrar o que precisa.
        </p>
      </header>

      {isLoading && (
        <div className="text-muted-foreground">Carregando categorias...</div>
      )}
      {error && (
        <div className="text-destructive">Erro ao carregar categorias.</div>
      )}

      {rootCategory && subcategories.length > 0 && (
        <section aria-label="Subcategorias" className="mb-8">
          <h2 className="font-display text-xl mb-3">Subcategorias</h2>
          <nav className="flex flex-wrap gap-2">
            {subcategories.map((sc: any) => (
              <Link
                key={sc.id}
                to={`/explorar?categoria=${sc.slug}`}
                className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                aria-label={`Explorar ${sc.name_pt}`}
              >
                {sc.name_pt}
              </Link>
            ))}
          </nav>
        </section>
      )}

      <div className="rounded-lg border p-6 text-muted-foreground">
        Em breve: listagem com filtros avançados.
      </div>
    </main>
  );
};

export default Explore;
