import { useEffect, useState, useCallback } from "react";
import { useNearbyListings } from "@/hooks/useNearbyListings";
import { ListingCard } from "@/components/listings/ListingCard";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

const NearbyListingsSection = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const requestLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      toast({ title: t("nearby.error"), description: t("nearby.error") });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        const denied = err.code === err.PERMISSION_DENIED;
        toast({ title: denied ? t("nearby.denied") : t("nearby.error") });
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [toast, t]);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  const { data: listings = [] } = useNearbyListings(coords?.lat ?? null, coords?.lng ?? null, 25, 9);

  if (!coords) {
    return (
      <section aria-label={t("nearby.title")} className="container py-8">
        <header className="mb-3">
          <h2 className="font-display text-xl">{t("nearby.title")}</h2>
        </header>
        <button
          onClick={requestLocation}
          className="inline-flex items-center rounded-md border px-3 py-1.5 hover:bg-accent transition"
        >
          {t("nearby.enable")}
        </button>
      </section>
    );
  }

  if (!listings.length) return null;

  return (
    <section aria-label={t("nearby.title")} className="container py-8 animate-fade-in">
      <header className="mb-4">
        <h2 className="font-display text-2xl">{t("nearby.title")}</h2>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map((l) => (
          <ListingCard key={l.id} listing={l as any} />
        ))}
      </div>
    </section>
  );
};

export default NearbyListingsSection;
