import { useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCategories } from "@/hooks/useCategories";
import { useListings } from "@/hooks/useListings";
import { ListingCard } from "@/components/listings/ListingCard";
import PromoCTA from "@/components/PromoCTA";

const Explore = () => {
  const [searchParams] = useSearchParams();
  const selectedSlug = searchParams.get("categoria") ?? undefined;
  const { data: categories, isLoading: loadingCats, error: catsError } = useCategories();

  const { selectedCategory, rootCategory, subcategories } = useMemo(() => {
    const list = categories ?? [];
    const selected = list.find((c: any) => c.slug === selectedSlug);
    const root = selected?.parent_id
      ? list.find((c: any) => c.id === selected.parent_id)
      : selected;
    const subs = root ? list.filter((c: any) => c.parent_id === root.id) : [];
    return { selectedCategory: selected, rootCategory: root, subcategories: subs };
  }, [categories, selectedSlug]);

  const { data: listings = [], isLoading: loadingListings } = useListings(
    { categorySlug: rootCategory?.slug || selectedSlug },
    categories
  );

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

      {loadingCats && (
        <div className="text-muted-foreground">Carregando categorias...</div>
      )}
      {catsError && (
        <div className="text-destructive">Erro ao carregar categorias.</div>
      )}

      <section className="mb-8">
        <PromoCTA />
      </section>

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

      <section aria-label="Resultados">
        <div className="mb-3 text-sm text-muted-foreground">
          {loadingListings ? "Carregando resultados…" : `${listings.length} resultado(s)`}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((l: any) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
        {!loadingListings && listings.length === 0 && (
          <div className="rounded-lg border p-6 text-muted-foreground mt-4">
            Nenhum anúncio encontrado nesta categoria.
          </div>
        )}
      </section>
    </main>
  );
};

export default Explore;
