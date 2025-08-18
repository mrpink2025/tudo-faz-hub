import { Link } from "react-router-dom";
import { useFeaturedListings } from "@/hooks/useFeaturedListings";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const formatPrice = (
  value: number | null | undefined,
  currency: string | null | undefined,
  fallback: string,
  locale: string
) => {
  if (value == null) return fallback;
  try {
    // Converter centavos para reais e formatar no padrão brasileiro
    const valueInReais = value / 100;
    return new Intl.NumberFormat('pt-BR', { 
      style: "currency", 
      currency: currency || "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(valueInReais);
  } catch {
    return `R$ ${(value / 100).toFixed(2).replace('.', ',')}`;
  }
};

const FeaturedListingsBar = () => {
  const { t, i18n } = useTranslation();
  const { data: listings = [] } = useFeaturedListings(12);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const autoplayRef = useRef<NodeJS.Timeout>();
  
  if (!listings.length) return null;
  const locale = i18n.language || "pt-BR";

  // Number of items to show at once
  const itemsPerView = 3;
  const maxIndex = Math.max(0, listings.length - itemsPerView);

  // Auto-advance carousel
  useEffect(() => {
    if (!isHovered && listings.length > itemsPerView) {
      autoplayRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          const next = prev + 1;
          return next > maxIndex ? 0 : next;
        });
      }, 4000); // Change slide every 4 seconds
    }

    return () => {
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current);
      }
    };
  }, [isHovered, listings.length]);

  const nextSlide = () => {
    setCurrentIndex((prev) => {
      const next = prev + 1;
      return next > maxIndex ? 0 : next;
    });
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => {
      const next = prev - 1;
      return next < 0 ? maxIndex : next;
    });
  };

  const goToSlide = (index: number) => {
    if (index <= maxIndex) {
      setCurrentIndex(index);
    }
  };

  return (
    <aside 
      aria-label="Anúncios em destaque" 
      className="bg-white border-b border-border shadow-sm"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="container py-3 overflow-hidden">
        <div className="relative bg-gradient-to-r from-muted/30 to-muted/20 rounded-lg p-4">
          {/* Carousel container */}
          <div className="flex transition-transform duration-500 ease-in-out gap-4" 
               style={{ transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)` }}>
            {listings.map((listing) => (
              <div key={listing.id} className="flex-shrink-0" style={{ width: `calc(${100 / itemsPerView}% - ${(itemsPerView - 1) * 16 / itemsPerView}px)` }}>
                <Link
                  to={`/anuncio/${listing.id}`}
                  className="flex items-center gap-3 p-4 rounded-lg bg-white hover:bg-primary/5 transition-all duration-300 group h-full border border-border/50 hover:border-primary/30 shadow-sm hover:shadow-md"
                  aria-label={`Ver anúncio em destaque: ${listing.title}`}
                >
                  {/* Image */}
                  <div className="relative overflow-hidden rounded-lg bg-muted flex-shrink-0 border border-border/30">
                    {listing.cover_image ? (
                      <img
                        src={listing.cover_image}
                        alt={listing.title}
                        className="w-16 h-16 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                        <span className="text-2xl">🏷️</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <h3 className="font-semibold text-base leading-tight text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {listing.title}
                    </h3>
                    <p className="text-lg font-bold text-primary">
                      {formatPrice(listing.price, listing.currency, t("price.combined"), locale)}
                    </p>
                    {listing.location && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <span className="text-xs">📍</span>
                        <span className="truncate">{listing.location}</span>
                      </p>
                    )}
                  </div>
                </Link>
              </div>
            ))}
          </div>

          {/* Navigation buttons */}
          {listings.length > itemsPerView && (
            <>
              <Button
                variant="outline"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white border-border shadow-lg backdrop-blur-sm h-10 w-10 z-10"
                onClick={prevSlide}
                aria-label="Anúncio anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white border-border shadow-lg backdrop-blur-sm h-10 w-10 z-10"
                onClick={nextSlide}
                aria-label="Próximo anúncio"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </>
          )}

          {/* Dots indicator */}
          {listings.length > itemsPerView && (
            <div className="flex justify-center mt-3 gap-2">
              {Array.from({ length: maxIndex + 1 }, (_, index) => (
                <button
                  key={index}
                  className={`h-2 rounded-full transition-all duration-200 ${
                    index === currentIndex 
                      ? 'bg-primary w-6' 
                      : 'bg-primary/30 hover:bg-primary/50 w-2'
                  }`}
                  onClick={() => goToSlide(index)}
                  aria-label={`Ir para grupo ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default FeaturedListingsBar;
