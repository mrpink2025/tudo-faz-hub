import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const ListingDetail = () => {
  const { id } = useParams<{ id: string }>();

  const { data: listing, isLoading, error } = useQuery({
    queryKey: ["listing", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*, categories:category_id(name_pt, slug)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: Boolean(id),
  });

  useEffect(() => {
    const title = listing?.title ? `${listing.title} - tudofaz.com` : "Anúncio - tudofaz.com";
    document.title = title;

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", listing?.description ?? "Detalhes do anúncio no tudofaz.com");

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", window.location.href);

    // JSON-LD Product
    const scriptId = "ld-json-listing";
    const prev = document.getElementById(scriptId);
    if (prev) prev.remove();
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = scriptId;
    const price = listing?.price != null ? String(listing.price) : undefined;
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Product",
      name: listing?.title,
      description: listing?.description,
      offers: price
        ? {
            "@type": "Offer",
            price,
            priceCurrency: listing?.currency || "BRL",
            availability: "https://schema.org/InStock",
          }
        : undefined,
    });
    document.head.appendChild(script);
  }, [listing]);

  if (isLoading) {
    return <main className="container py-10">Carregando…</main>;
  }
  if (error || !listing) {
    return <main className="container py-10">Anúncio não encontrado.</main>;
  }

  return (
    <main className="container py-8">
      <nav className="mb-4 text-sm text-muted-foreground">
        <Link to="/explorar">Explorar</Link>
        {listing.categories?.slug && (
          <>
            <span className="mx-2">/</span>
            <Link to={`/explorar?categoria=${listing.categories.slug}`}>{listing.categories.name_pt}</Link>
          </>
        )}
      </nav>

      <article>
        <header className="mb-4">
          <h1 className="font-display text-3xl">{listing.title}</h1>
          {listing.location && <p className="text-muted-foreground">{listing.location}</p>}
        </header>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Descrição</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-neutral max-w-none">
                {listing.description || "Sem descrição."}
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Preço</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">
                  {listing.price != null
                    ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: listing.currency || "BRL" }).format(listing.price)
                    : "A combinar"}
                </div>
              </CardContent>
            </Card>

            <Link to={listing.user_id ? `/mensagens?to=${listing.user_id}` : "/mensagens"}>
              <Button className="w-full">Enviar mensagem</Button>
            </Link>
          </aside>
        </div>
      </article>
    </main>
  );
};

export default ListingDetail;
