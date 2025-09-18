import { ListingCard } from "@/components/listings/ListingCard";
import { useFeaturedListings } from "@/hooks/useFeaturedListings";
import { useTranslation } from "react-i18next";
import { TranslatedText } from "@/components/ui/translated-text";

const FeaturedListingsSection = ({ title, limit = 6 }: { title?: string; limit?: number }) => {
  const { t, i18n } = useTranslation();
  const { data: listings = [], isLoading } = useFeaturedListings(limit);
  if (isLoading || !listings.length) return null;

  return (
    <section aria-label="Anúncios em destaque" className="container py-10">
      <header className="mb-4">
        <h2 className="font-display text-2xl">
          {title ? <TranslatedText key={`title-${i18n.language}`} text={title} domain="marketplace" /> : t("featured.title")}
        </h2>
        <p className="text-muted-foreground text-sm">
          <TranslatedText key={`subtitle-${i18n.language}`} text={t("featured.subtitle")} domain="marketplace" />
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map((l) => (
          <ListingCard key={l.id} listing={l as any} />
        ))}
      </div>
    </section>
  );
};

export default FeaturedListingsSection;
