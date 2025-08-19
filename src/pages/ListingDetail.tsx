import { useEffect, useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { ProductCard } from "@/components/ecommerce/ProductCard";
import { ProductReviews } from "@/components/ecommerce/ProductReviews";
import ContactSellerButton from "@/components/chat/ContactSellerButton";
import { ProductSizeDisplay } from "@/components/ecommerce/ProductSizeDisplay";

const ListingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { t, i18n } = useTranslation();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Capturar código de rastreamento de afiliado da URL
  const trackingCode = searchParams.get("ref");

  const { data: listing, isLoading, error } = useQuery({
    queryKey: ["listing", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select(`
          *, 
          categories:category_id(name_pt, slug)
        `)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: Boolean(id),
  });

  const { data: images = [] } = useQuery({
    queryKey: ["listing-images", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listing_images")
        .select("url, position")
        .eq("listing_id", id)
        .order("position", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: Boolean(id),
  });

  const allImages = [
    ...(listing?.cover_image ? [{ url: listing.cover_image, position: -1 }] : []),
    ...images
  ];
  const heroUrl = allImages[selectedImageIndex]?.url || "/placeholder.svg";

  // Registrar clique de afiliado se presente
  useEffect(() => {
    if (trackingCode && id && listing) {
      const trackClick = async () => {
        try {
          await supabase.functions.invoke("track-affiliate-click", {
            body: {
              trackingCode,
              listingId: id,
              userAgent: navigator.userAgent,
              referrer: document.referrer,
            },
          });
        } catch (error) {
          console.error("Error tracking affiliate click:", error);
        }
      };
      
      trackClick();
    }
  }, [trackingCode, id, listing]);

  // Reset selected image when listing changes
  useEffect(() => {
    setSelectedImageIndex(0);
  }, [listing?.id]);

  useEffect(() => {
    const title = listing?.title ? `${listing.title} - tudofaz.com` : `${t("listing.pageTitle")} - tudofaz.com`;
    document.title = title;

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", listing?.description ?? t("listing.metaDesc"));

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
      image: heroUrl,
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
  }, [listing, heroUrl]);

  if (isLoading) {
    return <main className="container py-10">{t("common.loading")}</main>;
  }
  if (error || !listing) {
    return <main className="container py-10">{t("listing.notFound")}</main>;
  }

  return (
    <main className="container py-8">
      <nav className="mb-4 text-sm text-muted-foreground">
        <Link to="/explorar">{t("listing.breadcrumbExplore")}</Link>
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
          <div className="md:col-span-2 space-y-4">
            <Card className="overflow-hidden">
              <div className="aspect-[16/9] bg-muted">
                <img
                  src={heroUrl}
                  alt={`${t("listing.imageAltMain")} ${listing.title}`}
                  className="w-full h-full object-cover"
                />
              </div>
              {allImages && allImages.length > 1 && (
                <CardContent className="pt-4">
                  <div className="grid grid-cols-4 gap-2">
                    {allImages.slice(0, 8).map((img: any, idx: number) => (
                      <button
                        key={`${img.url}-${idx}`}
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`aspect-[4/3] bg-muted overflow-hidden rounded transition-all duration-200 hover:opacity-80 ${
                          selectedImageIndex === idx ? 'ring-2 ring-primary' : ''
                        }`}
                      >
                        <img
                          src={img.url}
                          alt={`Foto ${idx + 1} de ${listing.title}`}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t("listing.description")}</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-neutral max-w-none">
                  {listing.description || t("listing.noDescription")}
                </CardContent>
              </Card>
          </div>

          <aside className="space-y-4">
            {/* Size Selection for products that require size */}
            {listing.sellable && listing.size_required && (
              <ProductSizeDisplay listingId={listing.id} />
            )}

            {listing.sellable ? (
              <ProductCard listing={listing} />
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>{t("listing.price")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold">
                      {listing.price != null
                        ? new Intl.NumberFormat('pt-BR', { 
                            style: "currency", 
                            currency: listing.currency || "BRL",
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          }).format(listing.price / 100)
                        : t("price.combined")}
                    </div>
                  </CardContent>
                </Card>

                <ContactSellerButton 
                  sellerId={listing.user_id}
                  sellerName="Vendedor"
                  listingTitle={listing.title}
                />
              </>
            )}
          </aside>
        </div>

        {/* Product Reviews Section - Only show for sellable items */}
        {listing.sellable && (
          <div className="mt-8">
            <ProductReviews listingId={listing.id} />
          </div>
        )}
      </article>
    </main>
  );
};

export default ListingDetail;
